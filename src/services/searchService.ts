import type { SearchResponse } from '../types/index';

export async function searchSheetMusic(
  query: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<SearchResponse> {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, page, pageSize }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? '搜索服务暂时不可用，请稍后重试');
  }

  return response.json();
}
