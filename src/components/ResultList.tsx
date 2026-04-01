import { useRef, useState, useCallback, type TouchEvent } from 'react';
import type { ResultListProps } from '../types/components';
import ResultItem from './ResultItem';

const PULL_THRESHOLD = 60;

export default function ResultList({
  results,
  currentPage,
  totalPages,
  onPageChange,
  onPreview,
  onDownload,
  onRefresh,
}: ResultListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (listRef.current && listRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff, PULL_THRESHOLD * 2));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500" role="status">
        <p>未找到相关曲谱，请尝试其他关键词</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center text-sm text-gray-400"
          style={{ height: pullDistance }}
        >
          {pullDistance >= PULL_THRESHOLD ? '松开刷新' : '下拉刷新'}
        </div>
      )}
      {isRefreshing && (
        <div className="flex items-center justify-center py-2 text-sm text-blue-500">
          刷新中...
        </div>
      )}

      {/* Scrollable result list */}
      <div
        ref={listRef}
        className="overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ul className="flex flex-col gap-3 p-3" role="list">
          {results.map((item) => (
            <li key={item.id}>
              <ResultItem
                item={item}
                onPreview={() => onPreview(item)}
                onDownload={() => onDownload(item)}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 border-t border-gray-200 py-3" aria-label="分页导航">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 disabled:opacity-40"
          >
            下一页
          </button>
        </nav>
      )}
    </div>
  );
}
