import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchEngine } from './searchEngine';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  try {
    const { query, page, pageSize } = req.body ?? {};

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: '请输入曲谱名称' });
    }

    const validPage = typeof page === 'number' && page >= 1 ? Math.floor(page) : 1;
    const validPageSize =
      typeof pageSize === 'number' && pageSize >= 1 && pageSize <= 100
        ? Math.floor(pageSize)
        : 20;

    const result = await searchEngine(query.trim(), validPage, validPageSize);

    return res.status(200).json(result);
  } catch (error) {
    console.error('搜索请求处理失败:', error);
    return res.status(500).json({ error: '搜索服务暂时不可用，请稍后重试' });
  }
}
