import type { RawSearchResult, SourceConfig } from '../../src/types/index';
import { BaseAdapter } from './SourceAdapter';

/**
 * 中优先级适配器 — 综合乐谱网站B
 *
 * 覆盖面广，包含考级曲目和流行音乐。
 * 当前为占位实现，返回模拟数据；接入真实 API 后替换 search 方法即可。
 */
export class SheetMusicSiteAdapter extends BaseAdapter {
  constructor(config: SourceConfig) {
    super(config);
  }

  async search(query: string, page: number, pageSize: number): Promise<RawSearchResult[]> {
    const results: RawSearchResult[] = [];
    const count = Math.min(pageSize, 4);

    for (let i = 0; i < count; i++) {
      const idx = (page - 1) * pageSize + i + 1;
      results.push({
        title: `${query} - 综合乐谱 第${idx}版`,
        sourceUrl: `${this.config.baseUrl}/sheet/${idx}`,
        thumbnailUrl: `${this.config.baseUrl}/thumb/${idx}.jpg`,
        imageUrls: [
          `${this.config.baseUrl}/images/${idx}_p1.jpg`,
          `${this.config.baseUrl}/images/${idx}_p2.jpg`,
          `${this.config.baseUrl}/images/${idx}_p3.jpg`,
        ],
        pageCount: 3,
      });
    }

    return results;
  }
}
