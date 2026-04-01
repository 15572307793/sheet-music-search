import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResultItem from './ResultItem';
import { DownloadProvider } from '../context/DownloadContext';
import type { SearchResult } from '../types/index';

const highPriorityItem: SearchResult = {
  id: 'item-1',
  title: '小星星变奏曲',
  sourceName: '专业钢琴网',
  sourceUrl: 'https://example.com/sheet/123',
  sourcePriority: 'high',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  imageUrls: ['https://example.com/p1.jpg', 'https://example.com/p2.jpg'],
  pageCount: 2,
  qualityTags: ['高清', '推荐'],
  matchScore: 1.0,
};

const lowPriorityItem: SearchResult = {
  ...highPriorityItem,
  id: 'item-2',
  sourcePriority: 'low',
  qualityTags: [],
};

function renderItem(
  item: SearchResult = highPriorityItem,
  onPreview = vi.fn(),
  onDownload = vi.fn(),
) {
  return render(
    <DownloadProvider>
      <ResultItem item={item} onPreview={onPreview} onDownload={onDownload} />
    </DownloadProvider>,
  );
}

describe('ResultItem', () => {
  it('renders title, source name, and source link', () => {
    renderItem();
    expect(screen.getByText('小星星变奏曲')).toBeInTheDocument();
    expect(screen.getByText('专业钢琴网')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: '查看原始来源' });
    expect(link).toHaveAttribute('href', 'https://example.com/sheet/123');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders quality tags for items with qualityTags', () => {
    renderItem(highPriorityItem);
    expect(screen.getByText('高清')).toBeInTheDocument();
    expect(screen.getByText('推荐')).toBeInTheDocument();
  });

  it('does not render quality tags when qualityTags is empty', () => {
    renderItem(lowPriorityItem);
    expect(screen.queryByText('高清')).not.toBeInTheDocument();
    expect(screen.queryByText('推荐')).not.toBeInTheDocument();
  });

  it('renders a download button', () => {
    renderItem();
    expect(screen.getByRole('button', { name: '下载' })).toBeInTheDocument();
  });

  it('calls onPreview when title is clicked', () => {
    const onPreview = vi.fn();
    renderItem(highPriorityItem, onPreview);
    fireEvent.click(screen.getByText('小星星变奏曲'));
    expect(onPreview).toHaveBeenCalledOnce();
  });

  it('calls onPreview when thumbnail is clicked', () => {
    const onPreview = vi.fn();
    renderItem(highPriorityItem, onPreview);
    // Thumbnail button has aria-label matching the title; it's the first button with that name
    const buttons = screen.getAllByRole('button', { name: '小星星变奏曲' });
    fireEvent.click(buttons[0]); // first is the Thumbnail button
    expect(onPreview).toHaveBeenCalledOnce();
  });

  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn();
    renderItem(highPriorityItem, vi.fn(), onDownload);
    fireEvent.click(screen.getByRole('button', { name: '下载' }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it('source link opens in new tab', () => {
    renderItem();
    const link = screen.getByRole('link', { name: '查看原始来源' });
    expect(link).toHaveAttribute('target', '_blank');
  });
});
