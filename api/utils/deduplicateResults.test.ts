import { describe, it, expect } from 'vitest';
import { deduplicateResults } from './deduplicateResults';
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

describe('deduplicateResults', () => {
  it('should return empty array for empty input', () => {
    expect(deduplicateResults([])).toEqual([]);
  });

  it('should return same results when no duplicates', () => {
    const results = [
      makeResult({ id: '1', title: '小星星' }),
      makeResult({ id: '2', title: '月光奏鸣曲' }),
    ];
    expect(deduplicateResults(results)).toEqual(results);
  });

  it('should keep first occurrence (highest priority) for duplicate titles', () => {
    const results = [
      makeResult({ id: '1', title: '小星星', sourcePriority: 'high', sourceName: 'SourceA' }),
      makeResult({ id: '2', title: '小星星', sourcePriority: 'medium', sourceName: 'SourceB' }),
      makeResult({ id: '3', title: '小星星', sourcePriority: 'low', sourceName: 'SourceC' }),
    ];
    const deduped = deduplicateResults(results);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe('1');
    expect(deduped[0].sourcePriority).toBe('high');
  });

  it('should deduplicate case-insensitively', () => {
    const results = [
      makeResult({ id: '1', title: 'Fur Elise', sourcePriority: 'high' }),
      makeResult({ id: '2', title: 'fur elise', sourcePriority: 'medium' }),
      makeResult({ id: '3', title: 'FUR ELISE', sourcePriority: 'low' }),
    ];
    const deduped = deduplicateResults(results);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe('1');
  });

  it('should deduplicate ignoring leading/trailing whitespace', () => {
    const results = [
      makeResult({ id: '1', title: '  小星星  ', sourcePriority: 'high' }),
      makeResult({ id: '2', title: '小星星', sourcePriority: 'low' }),
    ];
    const deduped = deduplicateResults(results);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe('1');
  });

  it('should preserve order of first occurrences', () => {
    const results = [
      makeResult({ id: '1', title: 'A曲', sourcePriority: 'high' }),
      makeResult({ id: '2', title: 'B曲', sourcePriority: 'high' }),
      makeResult({ id: '3', title: 'A曲', sourcePriority: 'medium' }),
      makeResult({ id: '4', title: 'C曲', sourcePriority: 'low' }),
      makeResult({ id: '5', title: 'B曲', sourcePriority: 'low' }),
    ];
    const deduped = deduplicateResults(results);
    expect(deduped).toHaveLength(3);
    expect(deduped[0].title).toBe('A曲');
    expect(deduped[1].title).toBe('B曲');
    expect(deduped[2].title).toBe('C曲');
  });

  it('should handle single result', () => {
    const results = [makeResult({ id: '1', title: '小星星' })];
    expect(deduplicateResults(results)).toEqual(results);
  });
});
