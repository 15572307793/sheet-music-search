export type QualityTag = '高清' | '推荐';

export type SourcePriority = 'high' | 'medium' | 'low';

export interface SearchResult {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  sourcePriority: SourcePriority;
  thumbnailUrl: string;
  imageUrls: string[];
  pageCount: number;
  qualityTags: QualityTag[];
  matchScore: number;
}

export interface RawSearchResult {
  title: string;
  sourceUrl: string;
  thumbnailUrl: string;
  imageUrls: string[];
  pageCount: number;
}

export interface SourceConfig {
  name: string;
  priority: SourcePriority;
  baseUrl: string;
  enabled: boolean;
  timeout: number;
}

export interface DownloadTask {
  resultId: string;
  status: 'idle' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface SearchRequest {
  query: string;
  page: number;
  pageSize: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
}
