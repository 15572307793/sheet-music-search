import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResultList from './ResultList';
import { DownloadProvider } from '../context/DownloadContext';
import type { SearchResult } from '../types/index';

function makeItem(id: string, title = `曲谱${id}`): SearchResult {
  return {
    id,
    title,
    sourceName: '测试来源',
    sourceUrl: `https://example.com/${id}`,
    sourcePriority: 'high',
    thumbnailUrl: `https://example.com/thumb-${id}.jpg`,
    imageUrls: [`https://example.com/img-${id}.jpg`],
    pageCount: 1,
    qualityTags: ['高清'],
    matchScore: 0.9,
  };
}

function makeItems(count: number): SearchResult[] {
  return Array.from({ length: count }, (_, i) => makeItem(String(i + 1)));
}

const defaultProps = {
  currentPage: 1,
  totalPages: 1,
  onPageChange: vi.fn(),
  onPreview: vi.fn(),
  onDownload: vi.fn(),
  onRefresh: vi.fn(),
};

function renderList(overrides: Partial<Parameters<typeof ResultList>[0]> = {}) {
  const props = { ...defaultProps, results: makeItems(3), ...overrides };
  return render(
    <DownloadProvider>
      <ResultList {...props} />
    </DownloadProvider>,
  );
}

describe('ResultList', () => {
  it('renders empty state message when results is empty', () => {
    renderList({ results: [] });
    expect(screen.getByText('未找到相关曲谱，请尝试其他关键词')).toBeInTheDocument();
  });

  it('does not render pagination when totalPages is 1', () => {
    renderList({ totalPages: 1 });
    expect(screen.queryByText('上一页')).not.toBeInTheDocument();
    expect(screen.queryByText('下一页')).not.toBeInTheDocument();
  });

  it('renders all result items', () => {
    renderList();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('renders pagination when totalPages > 1', () => {
    renderList({ totalPages: 5, currentPage: 2 });
    expect(screen.getByText('上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    renderList({ totalPages: 3, currentPage: 1 });
    expect(screen.getByText('上一页')).toBeDisabled();
    expect(screen.getByText('下一页')).not.toBeDisabled();
  });

  it('disables next button on last page', () => {
    renderList({ totalPages: 3, currentPage: 3 });
    expect(screen.getByText('上一页')).not.toBeDisabled();
    expect(screen.getByText('下一页')).toBeDisabled();
  });

  it('calls onPageChange with correct page on previous click', () => {
    const onPageChange = vi.fn();
    renderList({ totalPages: 3, currentPage: 2, onPageChange });
    fireEvent.click(screen.getByText('上一页'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with correct page on next click', () => {
    const onPageChange = vi.fn();
    renderList({ totalPages: 3, currentPage: 2, onPageChange });
    fireEvent.click(screen.getByText('下一页'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPreview with the correct item when preview is triggered', () => {
    const items = [makeItem('1', '测试曲谱')];
    const onPreview = vi.fn();
    renderList({ results: items, onPreview });
    // Click the title button to trigger preview
    fireEvent.click(screen.getByText('测试曲谱'));
    expect(onPreview).toHaveBeenCalledWith(items[0]);
  });

  it('has touch-scrollable container', () => {
    const { container } = renderList();
    const scrollable = container.querySelector('[style*="touch"]');
    expect(scrollable).toBeInTheDocument();
  });
});
