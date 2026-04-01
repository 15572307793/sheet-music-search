import { describe, it, expect } from 'vitest';
import { compareResults } from './sortResults';
import type { SearchResult } from '../../src/types/index';

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    id: 'test-id',
    title: 'Test',
    sourceName: 'Source',
    sourceUrl: 'https://example.com',
    sourcePriority: 'medium',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    imageUrls: ['https://example.com/img.jpg'],
    pageCount: 1,
    qualityTags: [],
    matchScore: 0.5,
    ...overrides,
  };
}

describe('compareResults', () => {
  it('should sort high priority before medium', () => {
    const a = makeResult({ sourcePriority: 'high' });
    const b = makeResult({ sourcePriority: 'medium' });
    expect(compareResults(a, b)).toBeLessThan(0);
  });

  it('should sort high priority before low', () => {
    const a = makeResult({ sourcePriority: 'high' });
    const b = makeResult({ sourcePriority: 'low' });
    expect(compareResults(a, b)).toBeLessThan(0);
  });

  it('should sort medium priority before low', () => {
    const a = makeResult({ sourcePriority: 'medium' });
    const b = makeResult({ sourcePriority: 'low' });
    expect(compareResults(a, b)).toBeLessThan(0);
  });

  it('should sort lower priority after higher', () => {
    const a = makeResult({ sourcePriority: 'low' });
    const b = makeResult({ sourcePriority: 'high' });
    expect(compareResults(a, b)).toBeGreaterThan(0);
  });

  it('should sort by matchScore descending within same priority', () => {
    const a = makeResult({ sourcePriority: 'high', matchScore: 0.6 });
    const b = makeResult({ sourcePriority: 'high', matchScore: 1.0 });
    expect(compareResults(a, b)).toBeGreaterThan(0);
  });

  it('should return 0 for equal priority and matchScore', () => {
    const a = makeResult({ sourcePriority: 'medium', matchScore: 0.8 });
    const b = makeResult({ sourcePriority: 'medium', matchScore: 0.8 });
    expect(compareResults(a, b)).toBe(0);
  });

  it('should produce correct order when used with Array.sort', () => {
    const results = [
      makeResult({ sourcePriority: 'low', matchScore: 1.0 }),
      makeResult({ sourcePriority: 'high', matchScore: 0.5 }),
      makeResult({ sourcePriority: 'medium', matchScore: 0.8 }),
      makeResult({ sourcePriority: 'high', matchScore: 1.0 }),
    ];
    const sorted = [...results].sort(compareResults);
    expect(sorted[0].sourcePriority).toBe('high');
    expect(sorted[0].matchScore).toBe(1.0);
    expect(sorted[1].sourcePriority).toBe('high');
    expect(sorted[1].matchScore).toBe(0.5);
    expect(sorted[2].sourcePriority).toBe('medium');
    expect(sorted[3].sourcePriority).toBe('low');
  });
});
