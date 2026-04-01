import { describe, it, expect, vi } from 'vitest';
import { searchEngine } from './searchEngine';
import type { SourceConfig, RawSearchResult } from '../../src/types/index';
import type { SourceAdapter } from '../adapters/SourceAdapter';

// --- Test helpers ---

function makeConfig(
  name: string,
  priority: 'high' | 'medium' | 'low',
  enabled = true,
  timeout = 10000
): SourceConfig {
  return { name, priority, baseUrl: `https://${name}.com`, enabled, timeout };
}

function makeMockAdapter(
  config: SourceConfig,
  results: RawSearchResult[],
  delay = 0
): SourceAdapter {
  return {
    name: config.name,
    priority: config.priority,
    search: async () => {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      return results;
    },
  };
}

function makeRawResults(prefix: string, count: number): RawSearchResult[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `${prefix} 第${i + 1}版`,
    sourceUrl: `https://example.com/${prefix}/${i + 1}`,
    thumbnailUrl: `https://example.com/${prefix}/thumb/${i + 1}.jpg`,
    imageUrls: [`https://example.com/${prefix}/img/${i + 1}.jpg`],
    pageCount: 1,
  }));
}

function makeFailingAdapter(config: SourceConfig): SourceAdapter {
  return {
    name: config.name,
    priority: config.priority,
    search: async () => {
      throw new Error(`${config.name} failed`);
    },
  };
}

// --- Tests ---

describe('searchEngine', () => {
  const highConfig = makeConfig('high-source', 'high');
  const mediumConfig = makeConfig('medium-source', 'medium');
  const lowConfig = makeConfig('low-source', 'low');

  it('should aggregate results from all enabled sources in parallel', async () => {
    const sources = [highConfig, mediumConfig, lowConfig];
    const adapterFactory = (config: SourceConfig) => {
      const count = config.priority === 'high' ? 5 : config.priority === 'medium' ? 4 : 3;
      return makeMockAdapter(config, makeRawResults(config.name, count));
    };

    const response = await searchEngine('test', 1, 20, sources, adapterFactory);

    expect(response.results.length).toBe(12); // 5 + 4 + 3
    expect(response.total).toBe(12);
    expect(response.page).toBe(1);
    expect(response.pageSize).toBe(20);
  });

  it('should sort results by priority (high > medium > low)', async () => {
    const sources = [highConfig, mediumConfig, lowConfig];
    const adapterFactory = (config: SourceConfig) =>
      makeMockAdapter(config, makeRawResults(config.name, 2));

    const response = await searchEngine('test', 1, 20, sources, adapterFactory);

    const priorities = response.results.map((r) => r.sourcePriority);
    const highIdx = priorities.lastIndexOf('high');
    const mediumIdx = priorities.indexOf('medium');
    const lowIdx = priorities.indexOf('low');

    if (mediumIdx >= 0) expect(highIdx).toBeLessThan(mediumIdx);
    if (lowIdx >= 0 && mediumIdx >= 0) expect(mediumIdx).toBeLessThan(lowIdx);
  });

  it('should assign quality tags based on source priority', async () => {
    const sources = [highConfig, mediumConfig, lowConfig];
    const adapterFactory = (config: SourceConfig) =>
      makeMockAdapter(config, makeRawResults(config.name, 1));

    const response = await searchEngine('test', 1, 20, sources, adapterFactory);

    const highResult = response.results.find((r) => r.sourcePriority === 'high');
    const mediumResult = response.results.find((r) => r.sourcePriority === 'medium');
    const lowResult = response.results.find((r) => r.sourcePriority === 'low');

    expect(highResult?.qualityTags).toEqual(['高清', '推荐']);
    expect(mediumResult?.qualityTags).toEqual(['推荐']);
    expect(lowResult?.qualityTags).toEqual([]);
  });

  it('should deduplicate results with same title, keeping highest priority', async () => {
    const sources = [highConfig, mediumConfig];
    const adapterFactory = (config: SourceConfig) =>
      makeMockAdapter(config, [
        {
          title: '月光奏鸣曲',
          sourceUrl: `https://${config.name}.com/1`,
          thumbnailUrl: `https://${config.name}.com/thumb/1.jpg`,
          imageUrls: [`https://${config.name}.com/img/1.jpg`],
          pageCount: 1,
        },
      ]);

    const response = await searchEngine('月光奏鸣曲', 1, 20, sources, adapterFactory);

    expect(response.results.length).toBe(1);
    expect(response.results[0].sourcePriority).toBe('high');
  });

  it('should paginate results correctly', async () => {
    const sources = [highConfig];
    const adapterFactory = (config: SourceConfig) =>
      makeMockAdapter(config, makeRawResults(config.name, 25));

    const page1 = await searchEngine('test', 1, 10, sources, adapterFactory);
    expect(page1.results.length).toBe(10);
    expect(page1.total).toBe(25);
    expect(page1.page).toBe(1);

    const page2 = await searchEngine('test', 2, 10, sources, adapterFactory);
    expect(page2.results.length).toBe(10);
    expect(page2.page).toBe(2);

    const page3 = await searchEngine('test', 3, 10, sources, adapterFactory);
    expect(page3.results.length).toBe(5);
    expect(page3.page).toBe(3);
  });

  it('should skip disabled sources', async () => {
    const disabledConfig = makeConfig('disabled-source', 'high', false);
    const sources = [disabledConfig, mediumConfig];
    const adapterFactory = (config: SourceConfig) =>
      makeMockAdapter(config, makeRawResults(config.name, 3));

    const response = await searchEngine('test', 1, 20, sources, adapterFactory);

    const sourceNames = response.results.map((r) => r.sourceName);
    expect(sourceNames).not.toContain('disabled-source');
    expect(response.results.length).toBe(3);
  });

  it('should silently ignore a timed-out source and return other results', async () => {
    const slowConfig = makeConfig('slow-source', 'medium', true, 50); // 50ms timeout
    const sources = [highConfig, slowConfig];

    const adapterFactory = (config: SourceConfig) => {
      if (config.name === 'slow-source') {
        return makeMockAdapter(config, makeRawResults(config.name, 3), 5000); // 5s delay
      }
      return makeMockAdapter(config, makeRawResults(config.name, 5));
    };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const response = await searchEngine('test', 1, 20, sources, adapterFactory);
    warnSpy.mockRestore();

    // Only high source results should be present
    expect(response.results.length).toBe(5);
    expect(response.results.every((r) => r.sourceName === 'high-source')).toBe(true);
  });

  it('should return empty results when all sources fail', async () => {
    const sources = [highConfig, mediumConfig];
    const adapterFactory = (config: SourceConfig) => makeFailingAdapter(config);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const response = await searchEngine('test', 1, 20, sources, adapterFactory);
    warnSpy.mockRestore();

    expect(response.results).toEqual([]);
    expect(response.total).toBe(0);
  });

  it('should return empty results when no sources are configured', async () => {
    const response = await searchEngine('test', 1, 20, [], () => {
      throw new Error('should not be called');
    });

    expect(response.results).toEqual([]);
    expect(response.total).toBe(0);
  });

  it('should calculate matchScore for each result', async () => {
    const sources = [highConfig];
    const adapterFactory = (config: SourceConfig) =>
      makeMockAdapter(config, [
        {
          title: '月光奏鸣曲',
          sourceUrl: 'https://example.com/1',
          thumbnailUrl: 'https://example.com/thumb/1.jpg',
          imageUrls: ['https://example.com/img/1.jpg'],
          pageCount: 1,
        },
      ]);

    const response = await searchEngine('月光奏鸣曲', 1, 20, sources, adapterFactory);

    expect(response.results[0].matchScore).toBe(1.0); // exact match
  });

  it('should include all required fields in each result', async () => {
    const sources = [highConfig];
    const adapterFactory = (config: SourceConfig) =>
      makeMockAdapter(config, makeRawResults(config.name, 1));

    const response = await searchEngine('test', 1, 20, sources, adapterFactory);
    const result = response.results[0];

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('sourceName');
    expect(result).toHaveProperty('sourceUrl');
    expect(result).toHaveProperty('sourcePriority');
    expect(result).toHaveProperty('thumbnailUrl');
    expect(result).toHaveProperty('imageUrls');
    expect(result).toHaveProperty('pageCount');
    expect(result).toHaveProperty('qualityTags');
    expect(result).toHaveProperty('matchScore');
  });

  it('should prioritize high-priority results when they return ≥5 within 5s', async () => {
    const sources = [highConfig, lowConfig];
    const adapterFactory = (config: SourceConfig) => {
      if (config.priority === 'high') {
        return makeMockAdapter(config, makeRawResults('high', 6), 0); // instant
      }
      return makeMockAdapter(config, makeRawResults('low', 3), 0);
    };

    const response = await searchEngine('test', 1, 20, sources, adapterFactory);

    // High priority results should come first
    const firstSix = response.results.slice(0, 6);
    expect(firstSix.every((r) => r.sourcePriority === 'high')).toBe(true);
  });
});
