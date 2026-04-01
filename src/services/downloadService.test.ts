import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadSheetMusic } from './downloadService';
import type { SearchResult } from '../types/index';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Stub URL.createObjectURL / revokeObjectURL
vi.stubGlobal('URL', {
  ...globalThis.URL,
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
});

beforeEach(() => {
  mockFetch.mockReset();
  document.body.innerHTML = '';
});

function makeItem(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    id: '1',
    title: '小星星',
    sourceName: 'TestSource',
    sourceUrl: 'https://example.com/1',
    sourcePriority: 'high',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    imageUrls: ['https://example.com/img1.jpg'],
    pageCount: 1,
    qualityTags: ['高清'],
    matchScore: 1.0,
    ...overrides,
  };
}

function mockImageResponse(type = 'image/jpeg') {
  return {
    ok: true,
    blob: () => Promise.resolve(new Blob(['fake-image-data'], { type })),
  };
}

describe('downloadSheetMusic', () => {
  it('downloads single-page image directly', async () => {
    mockFetch.mockResolvedValue(mockImageResponse());
    const onProgress = vi.fn();

    // Spy on createElement to capture the anchor click
    const clickSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    await downloadSheetMusic(makeItem(), onProgress);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/images?url=${encodeURIComponent('https://example.com/img1.jpg')}`,
    );
    expect(clickSpy).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(0);
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it('bundles multi-page images into a ZIP', async () => {
    const item = makeItem({
      pageCount: 3,
      imageUrls: [
        'https://example.com/p1.jpg',
        'https://example.com/p2.jpg',
        'https://example.com/p3.jpg',
      ],
    });

    mockFetch.mockResolvedValue(mockImageResponse());
    const onProgress = vi.fn();

    const clickSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    await downloadSheetMusic(item, onProgress);

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(clickSpy).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(0);
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it('throws when image fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(downloadSheetMusic(makeItem())).rejects.toThrow('图片下载失败');
  });

  it('reports progress for multi-page download', async () => {
    const item = makeItem({
      pageCount: 2,
      imageUrls: ['https://example.com/p1.jpg', 'https://example.com/p2.jpg'],
    });

    mockFetch.mockResolvedValue(mockImageResponse());
    const onProgress = vi.fn();

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = vi.fn();
      }
      return el;
    });

    await downloadSheetMusic(item, onProgress);

    // Progress: 0, 40 (1/2*80), 80 (2/2*80), 95, 100
    expect(onProgress).toHaveBeenCalledWith(0);
    expect(onProgress).toHaveBeenCalledWith(40);
    expect(onProgress).toHaveBeenCalledWith(80);
    expect(onProgress).toHaveBeenCalledWith(95);
    expect(onProgress).toHaveBeenCalledWith(100);
  });
});
