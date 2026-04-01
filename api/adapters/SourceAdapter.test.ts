import { describe, it, expect, vi } from 'vitest';
import { fetchWithTimeout, type SourceAdapter } from './SourceAdapter';
import { PianoSiteAdapter } from './PianoSiteAdapter';
import { SheetMusicSiteAdapter } from './SheetMusicSiteAdapter';
import { PopMusicSiteAdapter } from './PopMusicSiteAdapter';
import type { SourceConfig } from '../../src/types/index';

const highConfig: SourceConfig = {
  name: '专业钢琴曲谱网站A',
  priority: 'high',
  baseUrl: 'https://example-piano-a.com',
  enabled: true,
  timeout: 10000,
};

const mediumConfig: SourceConfig = {
  name: '综合乐谱网站B',
  priority: 'medium',
  baseUrl: 'https://example-sheet-b.com',
  enabled: true,
  timeout: 10000,
};

const lowConfig: SourceConfig = {
  name: '流行音乐曲谱网站C',
  priority: 'low',
  baseUrl: 'https://example-pop-c.com',
  enabled: true,
  timeout: 10000,
};

describe('PianoSiteAdapter (high priority)', () => {
  it('should have correct name and priority', () => {
    const adapter = new PianoSiteAdapter(highConfig);
    expect(adapter.name).toBe('专业钢琴曲谱网站A');
    expect(adapter.priority).toBe('high');
  });

  it('should return RawSearchResult[] from search', async () => {
    const adapter = new PianoSiteAdapter(highConfig);
    const results = await adapter.search('月光奏鸣曲', 1, 5);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r).toHaveProperty('title');
      expect(r).toHaveProperty('sourceUrl');
      expect(r).toHaveProperty('thumbnailUrl');
      expect(r).toHaveProperty('imageUrls');
      expect(r).toHaveProperty('pageCount');
      expect(r.title).toContain('月光奏鸣曲');
    }
  });
});

describe('SheetMusicSiteAdapter (medium priority)', () => {
  it('should have correct name and priority', () => {
    const adapter = new SheetMusicSiteAdapter(mediumConfig);
    expect(adapter.name).toBe('综合乐谱网站B');
    expect(adapter.priority).toBe('medium');
  });

  it('should return results with correct structure', async () => {
    const adapter = new SheetMusicSiteAdapter(mediumConfig);
    const results = await adapter.search('卡农', 1, 4);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.imageUrls.length).toBe(r.pageCount);
    }
  });
});

describe('PopMusicSiteAdapter (low priority)', () => {
  it('should have correct name and priority', () => {
    const adapter = new PopMusicSiteAdapter(lowConfig);
    expect(adapter.name).toBe('流行音乐曲谱网站C');
    expect(adapter.priority).toBe('low');
  });

  it('should return results with correct structure', async () => {
    const adapter = new PopMusicSiteAdapter(lowConfig);
    const results = await adapter.search('小星星', 1, 3);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.imageUrls.length).toBe(r.pageCount);
    }
  });
});

describe('fetchWithTimeout', () => {
  it('should return results when adapter responds within timeout', async () => {
    const adapter = new PianoSiteAdapter(highConfig);
    const results = await fetchWithTimeout(adapter, '月光奏鸣曲', 1, 5, 5000);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty array when adapter throws an error', async () => {
    const failingAdapter: SourceAdapter = {
      name: 'failing-source',
      priority: 'low',
      search: async () => { throw new Error('network error'); },
    };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const results = await fetchWithTimeout(failingAdapter, 'test', 1, 10, 5000);
    expect(results).toEqual([]);
    warnSpy.mockRestore();
  });

  it('should return empty array when adapter exceeds timeout', async () => {
    const slowAdapter: SourceAdapter = {
      name: 'slow-source',
      priority: 'medium',
      search: () => new Promise((resolve) => setTimeout(() => resolve([]), 5000)),
    };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const results = await fetchWithTimeout(slowAdapter, 'test', 1, 10, 50);
    expect(results).toEqual([]);
    warnSpy.mockRestore();
  });
});
