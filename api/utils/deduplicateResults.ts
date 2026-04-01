import type { SearchResult } from '../../src/types/index';

/**
 * 搜索结果去重函数
 *
 * 基于标题（忽略大小写和首尾空白）去重，保留最高优先级数据源的条目。
 * 前提：传入的结果已按优先级排序（高优先级在前），因此相同标题保留第一个即可。
 *
 * @param results - 已按优先级排序的搜索结果列表
 * @returns 去重后的搜索结果列表
 */
export function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  for (const result of results) {
    const key = result.title.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, result);
    }
  }
  return Array.from(seen.values());
}
