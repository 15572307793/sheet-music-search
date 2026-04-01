import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchSheetMusic } from './searchService';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('searchSheetMusic', () => {
  const mockResponse = {
    results: [
      {
        id: '1',
        title: '小星星',
        sourceName: 'TestSource',
        sourceUrl: 'https://example.com/1',
        sourcePriority: 'high' as const,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        imageUrls: ['https://example.com/img.jpg'],
        pageCount: 1,
        qualityTags: ['高清' as const],
        matchScore: 1.0,
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
  };

  it('sends POST request with correct body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await searchSheetMusic('小星星', 1, 20);

    expect(mockFetch).toHaveBeenCalledWith('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '小星星', page: 1, pageSize: 20 }),
    });
  });

  it('returns parsed SearchResponse on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await searchSheetMusic('小星星');
    expect(result).toEqual(mockResponse);
  });

  it('uses default page=1 and pageSize=20', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await searchSheetMusic('test');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
  });

  it('throws error with server message on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: '请输入曲谱名称' }),
    });

    await expect(searchSheetMusic('')).rejects.toThrow('请输入曲谱名称');
  });

  it('throws fallback error when response body is not JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(searchSheetMusic('test')).rejects.toThrow(
      '搜索服务暂时不可用，请稍后重试',
    );
  });
});
