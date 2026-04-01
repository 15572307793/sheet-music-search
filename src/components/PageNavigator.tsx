import { useRef, useCallback, type TouchEvent } from 'react';

export interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const SWIPE_THRESHOLD = 50;

export default function PageNavigator({ currentPage, totalPages, onPageChange }: PageNavigatorProps) {
  const touchStartX = useRef<number | null>(null);

  const goToPrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const goToNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (touchStartX.current === null || e.changedTouches.length === 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;

      if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
        if (deltaX > 0) {
          goToPrevious(); // swipe right → previous page
        } else {
          goToNext(); // swipe left → next page
        }
      }
    },
    [goToPrevious, goToNext]
  );

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <div
      className="flex items-center justify-center gap-4 py-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="page-navigator"
    >
      <button
        onClick={goToPrevious}
        disabled={isFirst}
        aria-label="上一页"
        className="rounded-full bg-white/20 p-2 text-white disabled:opacity-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      <span className="text-sm text-white" data-testid="page-indicator">
        {currentPage}/{totalPages}
      </span>

      <button
        onClick={goToNext}
        disabled={isLast}
        aria-label="下一页"
        className="rounded-full bg-white/20 p-2 text-white disabled:opacity-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
