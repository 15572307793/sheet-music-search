import type { RawSearchResult, SourceConfig } from '../../src/types/index';
import { BaseAdapter } from './SourceAdapter';

/**
 * Free-scores.com 适配器 — 低优先级
 *
 * 免费乐谱下载网站，提供大量公版和 CC 协议的钢琴乐谱。
 * 所有内容均为免费下载，无付费内容。
 */
export class FreeScoresAdapter extends BaseAdapter {
  constructor(config: SourceConfig) {
    super(config);
  }

  async search(query: string, _page: number, pageSize: number): Promise<RawSearchResult[]> {
    const searchUrl = `https://www.free-scores.com/search_sheet-music.php?CATEGORIE=piano&SEARCH=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    return this.parseSearchResults(html, pageSize);
  }

  private parseSearchResults(html: string, limit: number): RawSearchResult[] {
    const results: RawSearchResult[] = [];

    // free-scores.com 搜索结果包含乐谱链接和缩略图
    // 匹配模式: <a href="...sheet music link..."><img src="...thumbnail..."></a> 和标题
    const titlePattern = /<a\s+href="(https?:\/\/www\.free-scores\.com\/[^"]*(?:partition|sheet)[^"]*)"\s*[^>]*>\s*(?:<[^>]*>)*\s*([^<]+)/gi;
    const imgPattern = /<img[^>]+src="(https?:\/\/www\.free-scores\.com\/[^"]*(?:thumb|img|preview)[^"]*)"/gi;

    let match;
    const seen = new Set<string>();
    const thumbnails: string[] = [];

    // 先收集所有缩略图
    while ((match = imgPattern.exec(html)) !== null) {
      thumbnails.push(match[1]);
    }

    // 收集搜索结果
    let thumbIdx = 0;
    while ((match = titlePattern.exec(html)) !== null && results.length < limit) {
      const sourceUrl = match[1];
      const title = match[2].trim().replace(/&amp;/g, '&').replace(/&#\d+;/g, '');

      if (!title || title.length < 2) continue;
      if (seen.has(sourceUrl)) continue;
      seen.add(sourceUrl);

      results.push({
        title,
        sourceUrl,
        thumbnailUrl: thumbnails[thumbIdx] || '',
        imageUrls: [sourceUrl],
        pageCount: 1,
      });
      thumbIdx++;
    }

    return results;
  }
}
