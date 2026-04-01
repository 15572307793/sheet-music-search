import type { RawSearchResult, SourceConfig } from '../../src/types/index';
import { BaseAdapter } from './SourceAdapter';

/**
 * 低优先级适配器 — 流行音乐曲谱网站C
 *
 * 主要提供流行音乐简谱和钢琴谱。
 * 当前为占位实现，返回模拟数据；接入真实 API 后替换 search 方法即可。
 */
export class PopMusicSiteAdapter extends BaseAdapter {
  constructor(config: SourceConfig) {
    super(config);
  }

  async search(query: string, page: number, pageSize: number): Promise<RawSearchResult[]> {
    const results: RawSearchResult[] = [];
    const count = Math.min(pageSize, 3);

    for (let i = 0; i < count; i++) {
      const idx = (page - 1) * pageSize + i + 1;
      results.push({
        title: `${query} - 流行钢琴谱 第${idx}版`,
        sourceUrl: `${this.config.baseUrl}/pop/${idx}`,
        thumbnailUrl: `${this.config.baseUrl}/thumb/${idx}.jpg`,
        imageUrls: [`${this.config.baseUrl}/images/${idx}_p1.jpg`],
        pageCount: 1,
      });
    }

    return results;
  }
}
