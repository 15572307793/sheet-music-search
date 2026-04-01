import { useState, useCallback } from 'react';
import { useSearch } from './context/SearchContext';
import { useToast } from './context/ToastContext';
import { useDownloadHandler } from './hooks/useDownloadHandler';
import { searchSheetMusic } from './services/searchService';
import SearchBar from './components/SearchBar';
import ResultList from './components/ResultList';
import PreviewModal from './components/PreviewModal';
import Toast from './components/Toast';
import OfflineBanner from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';
import type { SearchResult } from './types/index';

export default function App() {
  const { state, dispatch } = useSearch();
  const { showToast } = useToast();
  const { handleDownload } = useDownloadHandler();
  const [previewItem, setPreviewItem] = useState<SearchResult | null>(null);

  const performSearch = useCallback(
    async (query: string, page: number = 1) => {
      dispatch({ type: 'SET_QUERY', payload: query });
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await searchSheetMusic(query, page);
        dispatch({ type: 'SET_RESULTS', payload: response });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '搜索服务暂时不可用，请稍后重试';
        dispatch({ type: 'SET_ERROR', payload: message });
        showToast(message, 'error');
      }
    },
    [dispatch, showToast],
  );

  const handleSearch = useCallback(
    (query: string) => performSearch(query, 1),
    [performSearch],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (state.query) performSearch(state.query, page);
    },
    [state.query, performSearch],
  );

  const handleRefresh = useCallback(() => {
    if (state.query) performSearch(state.query, state.currentPage);
  }, [state.query, state.currentPage, performSearch]);

  const handlePreview = useCallback((item: SearchResult) => {
    setPreviewItem(item);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setPreviewItem(null);
  }, []);

  const onDownload = useCallback(
    (item: SearchResult) => {
      handleDownload(item);
    },
    [handleDownload],
  );

  return (
    <div className="min-h-screen flex flex-col px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <OfflineBanner />
      <Toast />

      <header className="shrink-0">
        <h1 className="text-xl font-bold text-center py-3">乐谱搜索</h1>
        <SearchBar onSearch={handleSearch} isLoading={state.isLoading} />
      </header>

      {state.error && !state.isLoading && (
        <div role="alert" className="mx-3 mb-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <main className="flex-1 min-h-0">
        <ErrorBoundary>
          <ResultList
            results={state.results}
            currentPage={state.currentPage}
            totalPages={state.totalPages}
            onPageChange={handlePageChange}
            onPreview={handlePreview}
            onDownload={onDownload}
            onRefresh={handleRefresh}
          />
        </ErrorBoundary>
      </main>

      <ErrorBoundary>
        <PreviewModal
          item={previewItem}
          isOpen={previewItem !== null}
          onClose={handlePreviewClose}
          onDownload={() => {
            if (previewItem) onDownload(previewItem);
          }}
        />
      </ErrorBoundary>
    </div>
  );
}
