import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PreviewModal from './PreviewModal';
import { DownloadProvider } from '../context/DownloadContext';
import type { SearchResult } from '../types/index';

const mockItem: SearchResult = {
  id: 'preview-1',
  title: '小星星变奏曲',
  sourceName: '测试来源',
  sourceUrl: 'https://example.com/sheet',
  sourcePriority: 'high',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  imageUrls: [
    'https://example.com/page1.jpg',
    'https://example.com/page2.jpg',
    'https://example.com/page3.jpg',
  ],
  pageCount: 3,
  qualityTags: ['高清'],
  matchScore: 1.0,
};

const singlePageItem: SearchResult = {
  ...mockItem,
  id: 'preview-single',
  imageUrls: ['https://example.com/page1.jpg'],
  pageCount: 1,
};

function renderModal(props: Partial<Parameters<typeof PreviewModal>[0]> = {}) {
  const defaultProps = {
    item: mockItem,
    isOpen: true,
    onClose: vi.fn(),
    onDownload: vi.fn(),
  };
  const merged = { ...defaultProps, ...props };
  return {
    ...render(
      <DownloadProvider>
        <PreviewModal {...merged} />
      </DownloadProvider>,
    ),
    onClose: merged.onClose,
    onDownload: merged.onDownload,
  };
}

describe('PreviewModal', () => {
  it('renders nothing when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByTestId('preview-modal')).not.toBeInTheDocument();
  });

  it('renders nothing when item is null', () => {
    renderModal({ item: null });
    expect(screen.queryByTestId('preview-modal')).not.toBeInTheDocument();
  });

  it('renders full-screen overlay when open with item', () => {
    renderModal();
    const modal = screen.getByTestId('preview-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black');
  });

  it('displays item title in toolbar', () => {
    renderModal();
    expect(screen.getByText('小星星变奏曲')).toBeInTheDocument();
  });

  it('renders close button and calls onClose when clicked', () => {
    const { onClose } = renderModal();
    const closeBtn = screen.getByTestId('close-button');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders DownloadButton in toolbar', () => {
    renderModal();
    // DownloadButton renders with aria-label "下载" in idle state
    expect(screen.getByRole('button', { name: '下载' })).toBeInTheDocument();
  });

  it('renders ImageViewer with proxied image URL', () => {
    renderModal();
    const viewer = screen.getByTestId('image-viewer');
    expect(viewer).toBeInTheDocument();
    // The hidden loader img should use the proxy URL
    const loader = screen.getByTestId('image-loader');
    expect(loader).toHaveAttribute(
      'src',
      `/api/images?url=${encodeURIComponent('https://example.com/page1.jpg')}`,
    );
  });

  it('renders PageNavigator for multi-page items', () => {
    renderModal();
    expect(screen.getByTestId('page-navigator')).toBeInTheDocument();
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('1/3');
  });

  it('does not render PageNavigator for single-page items', () => {
    renderModal({ item: singlePageItem });
    expect(screen.queryByTestId('page-navigator')).not.toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    renderModal();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('hides loading spinner after image loads', async () => {
    renderModal();
    const loader = screen.getByTestId('image-loader');
    fireEvent.load(loader);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('shows error message and retry button on image load failure', async () => {
    renderModal();
    const loader = screen.getByTestId('image-loader');
    fireEvent.error(loader);
    await waitFor(() => {
      expect(screen.getByTestId('image-error')).toBeInTheDocument();
    });
    expect(screen.getByText('图片加载失败，请检查网络后重试')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('retries loading when retry button is clicked', async () => {
    renderModal();
    // Trigger error
    fireEvent.error(screen.getByTestId('image-loader'));
    await waitFor(() => {
      expect(screen.getByTestId('image-error')).toBeInTheDocument();
    });
    // Click retry
    fireEvent.click(screen.getByTestId('retry-button'));
    await waitFor(() => {
      expect(screen.queryByTestId('image-error')).not.toBeInTheDocument();
    });
    // Should show loading spinner again
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('supports swipe-down gesture to close', () => {
    const { onClose } = renderModal();
    const modal = screen.getByTestId('preview-modal');

    fireEvent.touchStart(modal, {
      touches: [{ clientY: 100 }],
    });
    fireEvent.touchEnd(modal, {
      changedTouches: [{ clientY: 250 }], // 150px > threshold of 100
    });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close on small swipe-down', () => {
    const { onClose } = renderModal();
    const modal = screen.getByTestId('preview-modal');

    fireEvent.touchStart(modal, {
      touches: [{ clientY: 100 }],
    });
    fireEvent.touchEnd(modal, {
      changedTouches: [{ clientY: 150 }], // 50px < threshold of 100
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('navigates pages and updates image URL', async () => {
    renderModal();
    // Initially page 1
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('1/3');

    // Click next page button
    const nextBtn = screen.getByRole('button', { name: '下一页' });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByTestId('page-indicator')).toHaveTextContent('2/3');
    });

    // Verify the loader img now points to page 2
    const loader = screen.getByTestId('image-loader');
    expect(loader).toHaveAttribute(
      'src',
      `/api/images?url=${encodeURIComponent('https://example.com/page2.jpg')}`,
    );
  });
});
