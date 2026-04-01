import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './search';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock searchEngine
vi.mock('./searchEngine', () => ({
  searchEngine: vi.fn(),
}));

import { searchEngine } from './searchEngine';
const mockSearchEngine = vi.mocked(searchEngine);

function createMockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    body: {},
    ...overrides,
  } as unknown as VercelRequest;
}

function createMockRes() {
  const res: Partial<VercelResponse> & { _status: number; _json: unknown } = {
    _status: 0,
    _json: null,
    status(code: number) {
      res._status = code;
      return res as VercelResponse;
    },
    json(data: unknown) {
      res._json = data;
      return res as VercelResponse;
    },
  };
  return res;
}

describe('POST /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-POST requests with 405', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(405);
  });

  it('returns 400 when query is missing', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(400);
    expect(res._json).toEqual({ error: '请输入曲谱名称' });
  });

  it('returns 400 when query is empty string', async () => {
    const req = createMockReq({ body: { query: '' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(400);
  });

  it('returns 400 when query is whitespace only', async () => {
    const req = createMockReq({ body: { query: '   ' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(400);
  });

  it('returns 400 when query is not a string', async () => {
    const req = createMockReq({ body: { query: 123 } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(400);
  });

  it('calls searchEngine with defaults when page/pageSize omitted', async () => {
    mockSearchEngine.mockResolvedValue({ results: [], total: 0, page: 1, pageSize: 20 });
    const req = createMockReq({ body: { query: '小星星' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(mockSearchEngine).toHaveBeenCalledWith('小星星', 1, 20);
    expect(res._status).toBe(200);
  });

  it('passes valid page and pageSize to searchEngine', async () => {
    mockSearchEngine.mockResolvedValue({ results: [], total: 0, page: 2, pageSize: 10 });
    const req = createMockReq({ body: { query: '月光', page: 2, pageSize: 10 } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(mockSearchEngine).toHaveBeenCalledWith('月光', 2, 10);
    expect(res._status).toBe(200);
  });

  it('defaults invalid page to 1', async () => {
    mockSearchEngine.mockResolvedValue({ results: [], total: 0, page: 1, pageSize: 20 });
    const req = createMockReq({ body: { query: '卡农', page: -1 } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(mockSearchEngine).toHaveBeenCalledWith('卡农', 1, 20);
  });

  it('clamps pageSize to 20 when exceeding 100', async () => {
    mockSearchEngine.mockResolvedValue({ results: [], total: 0, page: 1, pageSize: 20 });
    const req = createMockReq({ body: { query: '卡农', pageSize: 200 } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(mockSearchEngine).toHaveBeenCalledWith('卡农', 1, 20);
  });

  it('trims query whitespace', async () => {
    mockSearchEngine.mockResolvedValue({ results: [], total: 0, page: 1, pageSize: 20 });
    const req = createMockReq({ body: { query: '  小星星  ' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(mockSearchEngine).toHaveBeenCalledWith('小星星', 1, 20);
  });

  it('returns searchEngine result as JSON', async () => {
    const mockResult = {
      results: [{ id: '1', title: '小星星', sourceName: 'Test', sourceUrl: 'http://test.com', sourcePriority: 'high' as const, thumbnailUrl: '', imageUrls: [], pageCount: 1, qualityTags: [], matchScore: 1 }],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    mockSearchEngine.mockResolvedValue(mockResult);
    const req = createMockReq({ body: { query: '小星星' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(200);
    expect(res._json).toEqual(mockResult);
  });

  it('returns 500 when searchEngine throws', async () => {
    mockSearchEngine.mockRejectedValue(new Error('boom'));
    const req = createMockReq({ body: { query: '小星星' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: '搜索服务暂时不可用，请稍后重试' });
  });

  it('handles null body gracefully', async () => {
    const req = createMockReq({ body: null });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(400);
  });
});
