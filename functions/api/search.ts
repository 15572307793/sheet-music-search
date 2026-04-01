import { searchEngine } from '../../api/lib/searchEngine';

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = await context.request.json() as Record<string, unknown>;
    const { query, page, pageSize } = body;

    if (!query || typeof query !== 'string' || (query as string).trim().length === 0) {
      return Response.json({ error: '请输入曲谱名称' }, { status: 400 });
    }

    const validPage = typeof page === 'number' && page >= 1 ? Math.floor(page) : 1;
    const validPageSize =
      typeof pageSize === 'number' && pageSize >= 1 && pageSize <= 100
        ? Math.floor(pageSize)
        : 20;

    const result = await searchEngine((query as string).trim(), validPage, validPageSize);

    return Response.json(result);
  } catch (error) {
    console.error('搜索请求处理失败:', error);
    return Response.json({ error: '搜索服务暂时不可用，请稍后重试' }, { status: 500 });
  }
};
