import type {
  SearchResult,
  SearchResponse,
  SourceConfig,
  SourcePriority,
  QualityTag,
  RawSearchResult,
} from '../src/types/index';
import { fetchWithTimeout, type SourceAdapter } from './adapters/SourceAdapter';
import { PianoSiteAdapter } from './adapters/PianoSiteAdapter';
import { SheetMusicSiteAdapter } from './adapters/SheetMusicSiteAdapter';
import { PopMusicSiteAdapter } from './adapters/PopMusicSiteAdapter';
import { calculateMatchScore } from './utils/matchScore';
import { compareResults } from './utils/sortResults';
import { deduplicateResults } from './utils/deduplicateResults';
import sourcesConfigRaw from './config/sources.json';

const sourcesConfig = sourcesConfigRaw as { sources: SourceConfig[] };

/** 高优先级快速返回阈值 */
const HIGH_PRIORITY_TIMEOUT = 5000;
const HIGH_PRIORITY_MIN_RESULTS = 5;

/**
 * 根据数据源优先级返回质量标签
 */
function getQualityTags(priority: SourcePriority): QualityTag[] {
  if (priority === 'high') return ['高清', '推荐'];
  if (priority === 'medium') return ['推荐'];
  return [];
}

/**
 * 生成搜索结果唯一 ID（来源名 + sourceUrl 的简单哈希）
 */
function generateId(sourceName: string, sourceUrl: string): string {
  let hash = 0;
  const str = `${sourceName}:${sourceUrl}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * 将原始搜索结果转换为标准搜索结果
 */
function transformResult(
  raw: RawSearchResult,
  sourceName: string,
  priority: SourcePriority,
  query: string
): SearchResult {
  return {
    id: generateId(sourceName, raw.sourceUrl),
    title: raw.title,
    sourceName,
    sourceUrl: raw.sourceUrl,
    sourcePriority: priority,
    thumbnailUrl: raw.thumbnailUrl,
    imageUrls: raw.imageUrls,
    pageCount: raw.pageCount,
    qualityTags: getQualityTags(priority),
    matchScore: calculateMatchScore(raw.title, query),
  };
}

/**
 * 根据 SourceConfig 创建对应的适配器实例
 */
function createAdapter(config: SourceConfig): SourceAdapter {
  switch (config.priority) {
    case 'high':
      return new PianoSiteAdapter(config);
    case 'medium':
      return new SheetMusicSiteAdapter(config);
    case 'low':
      return new PopMusicSiteAdapter(config);
    default:
      return new SheetMusicSiteAdapter(config);
  }
}

/**
 * 搜索引擎聚合模块
 *
 * 核心逻辑：
 * 1. 读取配置，为每个启用的数据源创建适配器
 * 2. 并行查询所有数据源（各自带超时控制）
 * 3. 高优先级数据源 5 秒内返回 ≥5 条结果时优先展示
 * 4. 聚合所有结果，计算匹配度、排序、去重
 * 5. 分页返回
 * 6. 所有数据源失败时返回错误状态
 */
export async function searchEngine(
  query: string,
  page: number = 1,
  pageSize: number = 20,
  /** 可选：注入自定义数据源配置（用于测试） */
  customSources?: SourceConfig[],
  /** 可选：注入自定义适配器工厂（用于测试） */
  adapterFactory?: (config: SourceConfig) => SourceAdapter
): Promise<SearchResponse> {
  const sources: SourceConfig[] = customSources ?? sourcesConfig.sources;
  const enabledSources = sources.filter((s) => s.enabled);

  if (enabledSources.length === 0) {
    return { results: [], total: 0, page, pageSize };
  }

  const factory = adapterFactory ?? createAdapter;

  // 分离高优先级和其他数据源
  const highPrioritySources = enabledSources.filter((s) => s.priority === 'high');
  const otherSources = enabledSources.filter((s) => s.priority !== 'high');

  // 为每个数据源创建适配器和查询 Promise
  const createFetchPromise = (config: SourceConfig) => {
    const adapter = factory(config);
    return fetchWithTimeout(adapter, query, 1, 100, config.timeout).then((rawResults) => ({
      config,
      rawResults,
    }));
  };

  // 并行发起所有查询
  const highPromises = highPrioritySources.map(createFetchPromise);
  const otherPromises = otherSources.map(createFetchPromise);
  const allPromises = [...highPromises, ...otherPromises];

  let allResults: SearchResult[] = [];
  let highPriorityResults: SearchResult[] = [];
  let highPriorityReady = false;

  // 高优先级快速路径：5 秒内返回足够结果时优先展示
  if (highPromises.length > 0) {
    try {
      const highSettled = await Promise.race([
        Promise.allSettled(highPromises),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), HIGH_PRIORITY_TIMEOUT)),
      ]);

      if (highSettled !== null) {
        // 高优先级源在 5 秒内全部返回
        for (const result of highSettled) {
          if (result.status === 'fulfilled') {
            const { config, rawResults } = result.value;
            for (const raw of rawResults) {
              highPriorityResults.push(
                transformResult(raw, config.name, config.priority, query)
              );
            }
          }
        }
        if (highPriorityResults.length >= HIGH_PRIORITY_MIN_RESULTS) {
          highPriorityReady = true;
        }
      }
    } catch {
      // 高优先级快速路径失败，继续等待所有结果
    }
  }

  // 等待所有数据源返回
  const allSettled = await Promise.allSettled(allPromises);

  let anySuccess = false;
  for (const result of allSettled) {
    if (result.status === 'fulfilled') {
      const { config, rawResults } = result.value;
      if (rawResults.length > 0) {
        anySuccess = true;
      }
      for (const raw of rawResults) {
        allResults.push(transformResult(raw, config.name, config.priority, query));
      }
    }
  }

  // 所有数据源失败时返回错误状态
  if (!anySuccess && allResults.length === 0) {
    return {
      results: [],
      total: 0,
      page,
      pageSize,
    };
  }

  // 排序
  allResults.sort(compareResults);

  // 如果高优先级快速路径成功，确保高优先级结果排在最前面
  if (highPriorityReady) {
    highPriorityResults.sort(compareResults);
    const nonHighResults = allResults.filter((r) => r.sourcePriority !== 'high');
    allResults = [...highPriorityResults, ...nonHighResults];
  }

  // 去重
  const deduplicated = deduplicateResults(allResults);

  // 分页
  const total = deduplicated.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedResults = deduplicated.slice(startIndex, endIndex);

  return {
    results: paginatedResults,
    total,
    page,
    pageSize,
  };
}
