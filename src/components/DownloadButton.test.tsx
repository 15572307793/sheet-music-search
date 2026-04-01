import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DownloadButton from './DownloadButton';
import { DownloadProvider, useDownload } from '../context/DownloadContext';
import type { SearchResult } from '../types/index';
import type { DownloadAction } from '../context/DownloadContext';
import { useEffect } from 'react';

const mockItem: SearchResult = {
  id: 'test-item-1',
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

/** Helper that dispatches actions into the DownloadContext before rendering DownloadButton */
function SetupDispatch({ actions, children }: { actions: DownloadAction[]; children: React.ReactNode }) {
  const { dispatch } = useDownload();
  useEffect(() => {
    actions.forEach((a) => dispatch(a));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{children}</>;
}

function renderWithContext(
  onDownload = vi.fn(),
  actions: DownloadAction[] = [],
) {
  return render(
    <DownloadProvider>
      <SetupDispatch actions={actions}>
        <DownloadButton item={mockItem} onDownload={onDownload} />
      </SetupDispatch>
    </DownloadProvider>,
  );
}

describe('DownloadButton', () => {
  it('renders download button in idle state', () => {
    renderWithContext();
    const btn = screen.getByRole('button', { name: '下载' });
    expect(btn).toBeEnabled();
    expect(btn).toHaveTextContent('下载');
  });

  it('calls onDownload when clicked in idle state', () => {
    const onDownload = vi.fn();
    renderWithContext(onDownload);
    fireEvent.click(screen.getByRole('button', { name: '下载' }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it('shows progress and disables button during download', () => {
    renderWithContext(vi.fn(), [
      { type: 'START_DOWNLOAD', payload: { resultId: mockItem.id } },
      { type: 'UPDATE_PROGRESS', payload: { resultId: mockItem.id, progress: 42 } },
    ]);

    const btn = screen.getByRole('button', { name: '下载中' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('42%');
  });

  it('does not call onDownload when clicked during download', () => {
    const onDownload = vi.fn();
    renderWithContext(onDownload, [
      { type: 'START_DOWNLOAD', payload: { resultId: mockItem.id } },
    ]);

    fireEvent.click(screen.getByRole('button', { name: '下载中' }));
    expect(onDownload).not.toHaveBeenCalled();
  });

  it('shows "下载完成" when download is completed', () => {
    renderWithContext(vi.fn(), [
      { type: 'START_DOWNLOAD', payload: { resultId: mockItem.id } },
      { type: 'COMPLETE_DOWNLOAD', payload: { resultId: mockItem.id } },
    ]);

    expect(screen.getByText('下载完成')).toBeInTheDocument();
    expect(screen.getByTestId('download-completed')).toBeInTheDocument();
  });

  it('shows error message and retry button when download fails', () => {
    renderWithContext(vi.fn(), [
      { type: 'START_DOWNLOAD', payload: { resultId: mockItem.id } },
      { type: 'FAIL_DOWNLOAD', payload: { resultId: mockItem.id, error: '下载失败，请检查网络后重试' } },
    ]);

    expect(screen.getByText('下载失败，请检查网络后重试')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重试下载' })).toBeInTheDocument();
  });

  it('calls onDownload when retry button is clicked', () => {
    const onDownload = vi.fn();
    renderWithContext(onDownload, [
      { type: 'START_DOWNLOAD', payload: { resultId: mockItem.id } },
      { type: 'FAIL_DOWNLOAD', payload: { resultId: mockItem.id, error: '网络错误' } },
    ]);

    fireEvent.click(screen.getByRole('button', { name: '重试下载' }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it('shows default error text when no error message is provided', () => {
    renderWithContext(vi.fn(), [
      { type: 'START_DOWNLOAD', payload: { resultId: mockItem.id } },
      { type: 'FAIL_DOWNLOAD', payload: { resultId: mockItem.id, error: '' } },
    ]);

    expect(screen.getByText('下载失败')).toBeInTheDocument();
  });

  it('renders idle state when download task does not exist for item', () => {
    // Different item id — no task in context
    const otherItem: SearchResult = { ...mockItem, id: 'other-id' };
    render(
      <DownloadProvider>
        <DownloadButton item={otherItem} onDownload={vi.fn()} />
      </DownloadProvider>,
    );

    expect(screen.getByRole('button', { name: '下载' })).toBeEnabled();
  });
});
