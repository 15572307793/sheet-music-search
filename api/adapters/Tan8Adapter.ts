import type { RawSearchResult, SourceConfig } from '../../src/types/index';
import { BaseAdapter } from './SourceAdapter';

/**
 * 弹琴吧 (tan8.com) 适配器 — 中优先级
 *
 * 中文钢琴谱网站，包含大量流行音乐和古典钢琴谱。
 * 搜索免费可预览的内容。
 */
export class Tan8Adapter extends BaseAdapter {
  constructor(config: SourceConfig) {
    super(config);
  }

  async search(query: string, _page: number, pageSize: number): Promise<RawSearchResult[]> {
    // 弹琴吧搜索页面
    const searchUrl = `https://www.tan8.com/search-score?kw=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    return this.parseSearchResults(html, pageSize);
  }

  private parseSearchResults(html: string, limit: number): RawSearchResult[] {
    const results: RawSearchResult[] = [];

    // 匹配弹琴吧乐谱链接和标题
    // 常见格式: <a href="/unionscore-xxx.html">标题</a> 或 <a href="/score-xxx.html">
    const pattern = /<a\s+href="(\/(?:union)?score[^"]*\.html)"\s*[^>]*>([^<]+)<\/a>/gi;
    let match;
    const seen = new Set<string>();

    while ((match = pattern.exec(html)) !== null && results.length < limit) {
      const path = match[1];
      const rawTitle = match[2].trim();

      if (!rawTitle || rawTitle.length < 2) continue;
      if (rawTitle === '更多' || rawTitle === '搜索') continue;

      if (seen.has(path)) continue;
      seen.add(path);

      const sourceUrl = `https://www.tan8.com${path}`;
      const title = rawTitle.replace(/&amp;/g, '&').replace(/&#\d+;/g, '');

      // 尝试提取缩略图
      const thumbMatch = html.substring(Math.max(0, match.index - 500), match.index + 500)
        .match(/src="(https?:\/\/[^"]*(?:thumb|cover|img)[^"]*)"/i);

      results.push({
        title,
        sourceUrl,
        thumbnailUrl: thumbMatch ? thumbMatch[1] : '',
        imageUrls: [sourceUrl],
        pageCount: 1,
      });
    }

    return results;
  }
}
