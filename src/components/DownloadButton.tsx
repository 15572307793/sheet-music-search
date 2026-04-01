import { useDownload } from '../context/DownloadContext';
import type { SearchResult } from '../types/index';

interface DownloadButtonProps {
  item: SearchResult;
  onDownload: () => void;
}

export default function DownloadButton({ item, onDownload }: DownloadButtonProps) {
  const { state } = useDownload();
  const task = state.downloadTasks.get(item.id);

  const status = task?.status ?? 'idle';
  const progress = task?.progress ?? 0;
  const error = task?.error;

  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium" data-testid="download-completed">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        下载完成
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2" data-testid="download-failed">
        <span className="text-red-500 text-sm">{error || '下载失败'}</span>
        <button
          type="button"
          onClick={onDownload}
          className="text-blue-600 text-sm font-medium underline"
          aria-label="重试下载"
        >
          重试
        </button>
      </div>
    );
  }

  if (status === 'downloading') {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 text-gray-400 text-sm cursor-not-allowed"
        aria-label="下载中"
        data-testid="download-progress"
      >
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        {progress}%
      </button>
    );
  }

  // idle state
  return (
    <button
      type="button"
      onClick={onDownload}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
      aria-label="下载"
      data-testid="download-idle"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
      </svg>
      下载
    </button>
  );
}
