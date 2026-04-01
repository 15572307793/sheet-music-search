import { useCallback } from 'react';
import { useDownload } from '../context/DownloadContext';
import { downloadSheetMusic } from '../services/downloadService';
import type { SearchResult } from '../types/index';

export function useDownloadHandler() {
  const { state, dispatch } = useDownload();

  const handleDownload = useCallback(
    async (item: SearchResult) => {
      const task = state.downloadTasks.get(item.id);
      if (task?.status === 'downloading') return;

      dispatch({ type: 'START_DOWNLOAD', payload: { resultId: item.id } });

      try {
        await downloadSheetMusic(item, (progress) => {
          dispatch({
            type: 'UPDATE_PROGRESS',
            payload: { resultId: item.id, progress },
          });
        });

        dispatch({ type: 'COMPLETE_DOWNLOAD', payload: { resultId: item.id } });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '下载失败，请检查网络后重试';
        dispatch({
          type: 'FAIL_DOWNLOAD',
          payload: { resultId: item.id, error: message },
        });
      }
    },
    [state.downloadTasks, dispatch],
  );

  return { handleDownload };
}
