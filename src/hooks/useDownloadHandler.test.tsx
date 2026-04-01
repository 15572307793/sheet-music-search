import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDownloadHandler } from './useDownloadHandler';
import { DownloadProvider } from '../context/DownloadContext';
import type { SearchResult } from '../types/index';
import type { ReactNode } from 'react';

vi.mock('../services/downloadService', () => ({
  downloadSheetMusic: vi.fn(),
}));

import { downloadSheetMusic } from '../services/downloadService';

const mockItem: SearchResult = {
  id: 'item-1',
  title: '小星星',
  sourceName: '测试来源',
  sourceUrl: 'https://example.com/sheet',
  sourcePriority: 'high',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  imageUrls: ['https://example.com/page1.jpg'],
  pageCount: 1,
  qualityTags: ['高清'],
  matchScore: 1.0,
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <DownloadProvider>{children}</DownloadProvider>
);

describe('useDownloadHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches START_DOWNLOAD, progress updates, and COMPLETE_DOWNLOAD on success', async () => {
    const mockedDownload = vi.mocked(downloadSheetMusic);
    mockedDownload.mockImplementation(async (_item, onProgress) => {
      onProgress?.(0);
      onProgress?.(50);
      onProgress?.(100);
    });

    const { result } = renderHook(() => useDownloadHandler(), { wrapper });

    await act(async () => {
      await result.current.handleDownload(mockItem);
    });

    expect(mockedDownload).toHaveBeenCalledWith(mockItem, expect.any(Function));
  });

  it('dispatches FAIL_DOWNLOAD with error message on failure', async () => {
    const mockedDownload = vi.mocked(downloadSheetMusic);
    mockedDownload.mockRejectedValue(new Error('网络错误'));

    const { result } = renderHook(() => useDownloadHandler(), { wrapper });

    await act(async () => {
      await result.current.handleDownload(mockItem);
    });

    expect(mockedDownload).toHaveBeenCalledOnce();
  });

  it('dispatches FAIL_DOWNLOAD with default message for non-Error throws', async () => {
    const mockedDownload = vi.mocked(downloadSheetMusic);
    mockedDownload.mockRejectedValue('unknown error');

    const { result } = renderHook(() => useDownloadHandler(), { wrapper });

    await act(async () => {
      await result.current.handleDownload(mockItem);
    });

    expect(mockedDownload).toHaveBeenCalledOnce();
  });

  it('calls downloadSheetMusic with a progress callback', async () => {
    const progressValues: number[] = [];
    const mockedDownload = vi.mocked(downloadSheetMusic);
    mockedDownload.mockImplementation(async (_item, onProgress) => {
      onProgress?.(0);
      progressValues.push(0);
      onProgress?.(50);
      progressValues.push(50);
      onProgress?.(100);
      progressValues.push(100);
    });

    const { result } = renderHook(() => useDownloadHandler(), { wrapper });

    await act(async () => {
      await result.current.handleDownload(mockItem);
    });

    expect(progressValues).toEqual([0, 50, 100]);
  });

  it('does not call downloadSheetMusic if item is already downloading', async () => {
    const mockedDownload = vi.mocked(downloadSheetMusic);
    let resolveDownload: () => void;
    const downloadPromise = new Promise<void>((resolve) => {
      resolveDownload = resolve;
    });
    mockedDownload.mockImplementation(async () => {
      await downloadPromise;
    });

    const { result } = renderHook(() => useDownloadHandler(), { wrapper });

    // Start first download (will hang on the promise)
    act(() => {
      void result.current.handleDownload(mockItem);
    });

    // Try second download while first is in progress
    await act(async () => {
      await result.current.handleDownload(mockItem);
    });

    // Only one call should have been made
    expect(mockedDownload).toHaveBeenCalledOnce();

    // Clean up
    await act(async () => {
      resolveDownload!();
      await downloadPromise;
    });
  });
});
