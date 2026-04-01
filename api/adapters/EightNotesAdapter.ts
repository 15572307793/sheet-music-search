import type { RawSearchResult, SourceConfig } from '../../src/types/index';
import { BaseAdapter } from './SourceAdapter';

/**
 * 8notes.com 适配器 — 中优先级
 *
 * 免费乐谱网站，提供多种乐器的免费乐谱。
 * 通过搜索页面爬取结果，只返回免费可用的内容。
 */
export class EightNotesAdapter extends BaseAdapter {
  constructor(config: SourceConfig) {
    super(config);
  }

  async search(query: string, _page: number, pageSize: number): Promise<RawSearchResult[]> {
    const searchUrl = `https://www.8notes.com/search/default.asp?search_term=${encodeURIComponent(query)}&instrument=piano`;

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

    // 匹配搜索结果链接和标题
    // 8notes 搜索结果格式: <a href="/scores/...">Title</a>
    const linkPattern = /<a\s+href="(\/[^"]*(?:scores|piano)[^"]*)"\s*[^>]*>([^<]+)<\/a>/gi;
    let match;
    const seen = new Set<string>();

    while ((match = linkPattern.exec(html)) !== null && results.length < limit) {
      const path = match[1];
      const title = match[2].trim();

      // 过滤：只要乐谱相关链接，跳过导航/广告链接
      if (!title || title.length < 2) continue;
      if (path.includes('help') || path.includes('tour') || path.includes('login')) continue;
      if (seen.has(path)) continue;
      seen.add(path);

      const sourceUrl = `https://www.8notes.com${path}`;

      results.push({
        title: `${title} (Piano)`,
        sourceUrl,
        thumbnailUrl: '', // 8notes 搜索结果没有缩略图
        imageUrls: [sourceUrl],
        pageCount: 1,
      });
    }

    return results;
  }
}
