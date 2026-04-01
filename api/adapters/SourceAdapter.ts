import type { RawSearchResult, SourcePriority, SourceConfig } from '../../src/types/index';

/**
 * 数据源适配器接口
 *
 * 每个外部乐谱数据源实现此接口，提供统一的搜索方法。
 * 搜索引擎通过此接口并行查询所有启用的数据源。
 */
export interface SourceAdapter {
  readonly name: string;
  readonly priority: SourcePriority;
  search(query: string, page: number, pageSize: number): Promise<RawSearchResult[]>;
}

/**
 * 数据源请求包装，带超时和错误处理
 *
 * - 超时后自动中止请求
 * - 请求失败时静默降级，返回空结果
 *
 * @param adapter - 数据源适配器
 * @param query - 搜索关键词
 * @param page - 页码
 * @param pageSize - 每页条数
 * @param timeout - 超时时间（毫秒）
 * @returns 搜索结果数组，失败时返回空数组
 */
export async function fetchWithTimeout(
  adapter: SourceAdapter,
  query: string,
  page: number,
  pageSize: number,
  timeout: number
): Promise<RawSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const result = await Promise.race([
      adapter.search(query, page, pageSize),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () =>
          reject(new Error(`数据源 ${adapter.name} 请求超时 (${timeout}ms)`))
        );
      }),
    ]);
    return result;
  } catch (error) {
    console.warn(`数据源 ${adapter.name} 请求失败:`, error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 基础适配器抽象类
 *
 * 提供通用的构造逻辑，子类只需实现 search 方法。
 */
export abstract class BaseAdapter implements SourceAdapter {
  readonly name: string;
  readonly priority: SourcePriority;
  protected readonly config: SourceConfig;

  constructor(config: SourceConfig) {
    this.name = config.name;
    this.priority = config.priority;
    this.config = config;
  }

  abstract search(query: string, page: number, pageSize: number): Promise<RawSearchResult[]>;
}
