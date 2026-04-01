import type { RawSearchResult, SourceConfig } from '../../src/types/index';
import { BaseAdapter } from './SourceAdapter';

/**
 * 人人钢琴网 (everyonepiano.cn) 适配器 — 高优先级
 *
 * 中文免费钢琴谱网站，提供五线谱和双手简谱下载。
 * 包含大量流行音乐、古典音乐和考级曲目。
 */
export class EveryonePianoAdapter extends BaseAdapter {
  constructor(config: SourceConfig) {
    super(config);
  }

  async search(query: string, page: number, pageSize: number): Promise<RawSearchResult[]> {
    // 人人钢琴网搜索 URL 格式
    const pageParam = page > 1 ? `-p${page}` : '';
    const searchUrl = `https://www.everyonepiano.cn/Music-search-${encodeURIComponent(query)}${pageParam}.html`;

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

    // 匹配乐谱链接: /Music-数字-标题.html
    const pattern = /<a\s+href="(\/[Mm]usic-\d+[^"]*\.html)"\s*[^>]*>([^<]+)<\/a>/gi;
    let match;
    const seen = new Set<string>();

    while ((match = pattern.exec(html)) !== null && results.length < limit) {
      const path = match[1];
      const rawTitle = match[2].trim();

      // 过滤非乐谱链接
      if (!path.match(/\/[Mm]usic-\d+/)) continue;
      if (!rawTitle || rawTitle.length < 2) continue;
      if (rawTitle === '更多' || rawTitle === '搜索' || rawTitle === '登录') continue;

      const normalizedPath = path.toLowerCase();
      if (seen.has(normalizedPath)) continue;
      seen.add(normalizedPath);

      const sourceUrl = `https://www.everyonepiano.cn${path}`;

      // 清理标题中的 HTML 实体
      const title = rawTitle
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '');

      results.push({
        title,
        sourceUrl,
        thumbnailUrl: '', // 搜索结果页没有缩略图
        imageUrls: [sourceUrl],
        pageCount: 1,
      });
    }

    return results;
  }
}
