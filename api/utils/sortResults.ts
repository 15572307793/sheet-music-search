import type { SearchResult, SourcePriority } from '../../src/types/index';

const priorityOrder: Record<SourcePriority, number> = { high: 0, medium: 1, low: 2 };

/**
 * 搜索结果排序比较函数
 *
 * 排序规则：
 * 1. 按数据源优先级排序：high > medium > low
 * 2. 同优先级内按匹配度降序排序（matchScore 高的在前）
 *
 * @param a - 搜索结果 A
 * @param b - 搜索结果 B
 * @returns 负数表示 a 排在前，正数表示 b 排在前，0 表示相等
 */
export function compareResults(a: SearchResult, b: SearchResult): number {
  const priorityDiff = priorityOrder[a.sourcePriority] - priorityOrder[b.sourcePriority];
  if (priorityDiff !== 0) return priorityDiff;
  return b.matchScore - a.matchScore;
}
