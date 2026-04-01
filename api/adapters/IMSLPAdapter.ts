import type { RawSearchResult, SourceConfig } from '../../src/types/index';
import { BaseAdapter } from './SourceAdapter';

/**
 * IMSLP（国际乐谱图书馆）适配器 — 高优先级
 *
 * 通过 MediaWiki OpenSearch API 搜索公版免费乐谱。
 * IMSLP 拥有 25 万+ 古典音乐乐谱，全部为公版或 CC 协议。
 */
export class IMSLPAdapter extends BaseAdapter {
  constructor(config: SourceConfig) {
    super(config);
  }

  async search(query: string, _page: number, pageSize: number): Promise<RawSearchResult[]> {
    const limit = Math.min(pageSize, 20);

    // 使用 MediaWiki OpenSearch API 搜索
    const apiUrl = `https://imslp.org/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'SheetMusicSearch/1.0 (Educational Piano Tool)',
      },
    });

    if (!response.ok) return [];

    const data = await response.json() as [string, string[], string[], string[]];
    // OpenSearch 返回格式: [query, [titles], [descriptions], [urls]]
    const titles = data[1] || [];
    const urls = data[3] || [];

    const results: RawSearchResult[] = [];

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const pageUrl = urls[i] || `https://imslp.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

      // 过滤掉非乐谱页面（分类页、用户页等）
      if (title.includes(':') && !title.includes(',')) continue;

      results.push({
        title: title,
        sourceUrl: pageUrl,
        // IMSLP 没有直接的缩略图 API，使用占位图
        thumbnailUrl: `https://imslp.org/images/thumb/imslp-logo.png/120px-imslp-logo.png`,
        // 实际 PDF/图片需要从作品页面获取，这里提供页面链接
        imageUrls: [pageUrl],
        pageCount: 1,
      });
    }

    return results;
  }
}
