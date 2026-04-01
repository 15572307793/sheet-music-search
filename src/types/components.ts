import type { SearchResult } from './index';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export interface ResultListProps {
  results: SearchResult[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPreview: (item: SearchResult) => void;
  onDownload: (item: SearchResult) => void;
  onRefresh: () => void;
}

export interface ResultItemProps {
  item: SearchResult;
  onPreview: () => void;
  onDownload: () => void;
}

export interface PreviewModalProps {
  item: SearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export interface DownloadButtonProps {
  item: SearchResult;
  onDownload: () => void;
  progress: number | null;
}
