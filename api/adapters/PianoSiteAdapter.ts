import type { RawSearchResult, SourceConfig } from '../../src/types/index';
import { BaseAdapter } from './SourceAdapter';

/**
 * 高优先级适配器 — 专业钢琴曲谱网站A
 *
 * 提供高清钢琴考级曲谱，结果质量最高。
 * 当前为占位实现，返回模拟数据；接入真实 API 后替换 search 方法即可。
 */
export class PianoSiteAdapter extends BaseAdapter {
  constructor(config: SourceConfig) {
    super(config);
  }

  async search(query: string, page: number, pageSize: number): Promise<RawSearchResult[]> {
    // 占位实现：根据查询生成模拟结果
    const results: RawSearchResult[] = [];
    const count = Math.min(pageSize, 5);

    for (let i = 0; i < count; i++) {
      const idx = (page - 1) * pageSize + i + 1;
      results.push({
        title: `${query} - 钢琴谱 第${idx}版`,
        sourceUrl: `${this.config.baseUrl}/score/${idx}`,
        thumbnailUrl: `${this.config.baseUrl}/thumb/${idx}.jpg`,
        imageUrls: [
          `${this.config.baseUrl}/images/${idx}_p1.jpg`,
          `${this.config.baseUrl}/images/${idx}_p2.jpg`,
        ],
        pageCount: 2,
      });
    }

    return results;
  }
}
