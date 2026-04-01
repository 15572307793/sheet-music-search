import { describe, it, expect } from 'vitest';
import { calculateMatchScore } from './matchScore';

describe('calculateMatchScore', () => {
  describe('完全匹配 (1.0)', () => {
    it('should return 1.0 for exact match', () => {
      expect(calculateMatchScore('小星星', '小星星')).toBe(1.0);
    });

    it('should return 1.0 for exact match ignoring case', () => {
      expect(calculateMatchScore('Fur Elise', 'fur elise')).toBe(1.0);
    });

    it('should return 1.0 for exact match ignoring leading/trailing whitespace', () => {
      expect(calculateMatchScore('  小星星  ', ' 小星星 ')).toBe(1.0);
    });
  });

  describe('包含匹配 (0.8)', () => {
    it('should return 0.8 when title contains the full query', () => {
      expect(calculateMatchScore('小星星变奏曲', '小星星')).toBe(0.8);
    });

    it('should return 0.8 for case-insensitive containment', () => {
      expect(calculateMatchScore('Beethoven Fur Elise', 'fur elise')).toBe(0.8);
    });
  });

  describe('部分词匹配 (0 ~ 0.6)', () => {
    it('should return 0.6 when all query words match individually', () => {
      expect(calculateMatchScore('Fur Elise Piano', 'Elise Fur')).toBe(0.6);
    });

    it('should return 0.3 when half of query words match', () => {
      expect(calculateMatchScore('小星星', '小星星 月亮')).toBe(0.3);
    });

    it('should return 0 when no query words match', () => {
      expect(calculateMatchScore('小星星', '月光奏鸣曲')).toBe(0);
    });
  });

  describe('边界情况', () => {
    it('should return 0 for empty query', () => {
      expect(calculateMatchScore('小星星', '')).toBe(0);
    });

    it('should return 0 for empty title', () => {
      expect(calculateMatchScore('', '小星星')).toBe(0);
    });

    it('should return 0 for both empty', () => {
      expect(calculateMatchScore('', '')).toBe(0);
    });

    it('should return 0 for whitespace-only query', () => {
      expect(calculateMatchScore('小星星', '   ')).toBe(0);
    });

    it('should return 0 for whitespace-only title', () => {
      expect(calculateMatchScore('   ', '小星星')).toBe(0);
    });
  });

  describe('匹配度排序一致性', () => {
    it('exact match > contains match > partial match', () => {
      const exact = calculateMatchScore('Fur Elise', 'Fur Elise');
      const contains = calculateMatchScore('Beethoven Fur Elise', 'Fur Elise');
      const partial = calculateMatchScore('Fur Sonata', 'Fur Elise');

      expect(exact).toBeGreaterThan(contains);
      expect(contains).toBeGreaterThan(partial);
    });
  });
});
