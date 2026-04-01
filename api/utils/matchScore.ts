/**
 * 计算乐谱标题与搜索关键词的匹配度分数
 *
 * 三级匹配逻辑：
 * - 完全匹配: 1.0（标题与关键词完全相同，忽略大小写和首尾空白）
 * - 包含匹配: 0.8（标题包含完整关键词）
 * - 部分词匹配: 0 ~ 0.6（基于关键词中匹配词的比例）
 *
 * @param title - 乐谱标题
 * @param query - 搜索关键词
 * @returns 匹配度分数 (0-1)
 */
export function calculateMatchScore(title: string, query: string): number {
  const normalizedTitle = title.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();

  // 空查询或空标题返回 0
  if (normalizedQuery === '' || normalizedTitle === '') return 0;

  // 完全匹配
  if (normalizedTitle === normalizedQuery) return 1.0;

  // 包含匹配
  if (normalizedTitle.includes(normalizedQuery)) return 0.8;

  // 部分词匹配：基于关键词重叠比例
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  if (queryWords.length === 0) return 0;

  const matchedWords = queryWords.filter(w => normalizedTitle.includes(w));
  return (matchedWords.length / queryWords.length) * 0.6;
}
