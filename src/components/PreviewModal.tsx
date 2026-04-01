import { useState, useCallback, useRef, useEffect } from 'react';
import type { PreviewModalProps } from '../types/components';
import ImageViewer from './ImageViewer';
import PageNavigator from './PageNavigator';
import DownloadButton from './DownloadButton';

const SWIPE_DOWN_THRESHOLD = 100;

export default function PreviewModal({ item, isOpen, onClose, onDownload }: PreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const touchStartY = useRef<number | null>(null);

  // Reset state when item changes or modal opens
  useEffect(() => {
    if (isOpen && item) {
      setCurrentPage(1);
      setImageLoading(true);
      setImageError(false);
    }
  }, [isOpen, item?.id]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setImageLoading(true);
    setImageError(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setImageLoading(true);
    setImageError(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartY.current === null || e.changedTouches.length === 0) return;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      touchStartY.current = null;
      if (deltaY >= SWIPE_DOWN_THRESHOLD) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen || !item) return null;

  const totalPages = item.pageCount;
  const currentImageUrl = item.imageUrls[currentPage - 1] ?? '';
  const proxiedImageUrl = `/api/images?url=${encodeURIComponent(currentImageUrl)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      data-testid="preview-modal"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 pt-[env(safe-area-inset-top)] bg-black/80">
        <h2 className="text-white text-sm truncate flex-1 mr-2">{item.title}</h2>
        <div className="flex items-center gap-3">
          <DownloadButton item={item} onDownload={onDownload} />
          <button
            onClick={onClose}
            aria-label="关闭预览"
            className="text-white p-1"
            data-testid="close-button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 relative overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" data-testid="loading-spinner">
            <svg className="w-10 h-10 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" data-testid="image-error">
            <p className="text-white text-sm">图片加载失败，请检查网络后重试</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md"
              data-testid="retry-button"
            >
              重试
            </button>
          </div>
        ) : (
          <>
            <ImageViewer src={proxiedImageUrl} alt={`${item.title} - 第${currentPage}页`} />
            {/* Hidden img to track load/error events */}
            <img
              key={`${proxiedImageUrl}-${imageError}`}
              src={proxiedImageUrl}
              alt=""
              className="hidden"
              onLoad={handleImageLoad}
              onError={handleImageError}
              data-testid="image-loader"
            />
          </>
        )}
      </div>

      {/* Bottom page navigator */}
      {totalPages > 1 && (
        <div className="bg-black/80 pb-[env(safe-area-inset-bottom)]">
          <PageNavigator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
