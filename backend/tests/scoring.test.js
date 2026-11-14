import { describe, it, expect } from 'vitest';
import { 
  calculateKanalisaScore, 
  calculateSpeedScore, 
  calculateEngagementScore, 
  calculateSEOScore, 
  calculateKeywordRelevance,
  calculateOutlierRatio,
  estimateEarningsRupiah 
} from '../src/services/scoring.js';

describe('Scoring Service - Skor Kanalisa (§7.1)', () => {
  describe('calculateSpeedScore', () => {
    it('should return 50 when medianVPH is 0', () => {
      expect(calculateSpeedScore(1000, 0)).toBe(50);
    });
    
    it('should return higher score when VPH > median', () => {
      const score = calculateSpeedScore(5000, 1000);
      expect(score).toBeGreaterThan(50);
    });
    
    it('should return lower score when VPH < median', () => {
      const score = calculateSpeedScore(500, 1000);
      expect(score).toBeLessThan(50);
    });
    
    it('should clamp to 0-100', () => {
      expect(calculateSpeedScore(1000000, 1)).toBeLessThanOrEqual(100);
      expect(calculateSpeedScore(0, 1000)).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('calculateEngagementScore', () => {
    it('should return 0 for zero views', () => {
      expect(calculateEngagementScore(100, 50, 0, 0.02)).toBe(0);
    });
    
    it('should calculate rate correctly', () => {
      const score = calculateEngagementScore(5000, 200, 100000, 0.03);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
    
    it('should return higher score when engagement > category median', () => {
      const highEngagement = calculateEngagementScore(10000, 500, 100000, 0.02);
      const lowEngagement = calculateEngagementScore(1000, 50, 100000, 0.02);
      expect(highEngagement).toBeGreaterThan(lowEngagement);
    });
  });
  
  describe('calculateSEOScore', () => {
    it('should give full score for optimal video', () => {
      const result = calculateSEOScore(
        'Cara Edit Video CapCut untuk Pemula Lengkap Tutorial',
        'Deskripsi panjang yang berisi informasi lengkap tentang cara edit video menggunakan CapCut di HP. Tonton sampai habis ya! https://instagram.com/creator #tutorial #capcut #editvideo 00:00 Intro 01:30 Step 1',
            ['cara edit video', 'capcut', 'tutorial', 'pemula', 'lengkap', 'video editing']
      );
      
      expect(result.score).toBe(100);
      expect(result.checks.every(c => c.passed === true)).toBe(true);
    });
    
    it('should penalize short title', () => {
      const result = calculateSEOScore('Short', 'Description here', ['tag1', 'tag2']);
      expect(result.score).toBeLessThan(100);
      expect(result.checks[0].passed).toBe(false);
    });
    
    it('should penalize long title', () => {
      const longTitle = 'A'.repeat(101);
      const result = calculateSEOScore(longTitle, 'Description here', ['tag1', 'tag2']);
      expect(result.checks[0].passed).toBe(false);
    });
    
    it('should penalize short description', () => {
      const result = calculateSEOScore('Good Title Here', 'Short', ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
      expect(result.checks[1].passed).toBe(false);
    });
    
    it('should penalize too few tags', () => {
      const result = calculateSEOScore('Good Title Here', 'Long description here', ['tag1']);
      expect(result.checks[2].passed).toBe(false);
    });
    
    it('should penalize too many tags', () => {
      const tags = Array.from({ length: 16 }, (_, i) => `tag${i}`);
      const result = calculateSEOScore('Good Title Here', 'Long description here', tags);
      expect(result.checks[2].passed).toBe(false);
    });
    
    it('should check for links', () => {
      const withLink = calculateSEOScore('Title', 'Desc with https://link.com', ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
      const withoutLink = calculateSEOScore('Title', 'Desc without link', ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
      expect(withLink.checks[3].passed).toBe(true);
      expect(withoutLink.checks[3].passed).toBe(false);
    });
    
    it('should check for timestamps', () => {
      const withTs = calculateSEOScore('Title', 'Desc 00:00 Intro 01:30 Step', ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
      const withoutTs = calculateSEOScore('Title', 'Desc no timestamps', ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
      expect(withTs.checks[4].passed).toBe(true);
      expect(withoutTs.checks[4].passed).toBe(false);
    });
    
    it('should check for hashtags', () => {
      const withHash = calculateSEOScore('Title', 'Desc #hashtag #tag', ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
      const withoutHash = calculateSEOScore('Title', 'Desc no hashtags', ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
      expect(withHash.checks[5].passed).toBe(true);
      expect(withoutHash.checks[5].passed).toBe(false);
    });
    
    it('should check keyword consistency', () => {
      const result = calculateSEOScore(
        'Cara Edit Video CapCut',
        'Belajar cara edit video CapCut di sini',
        ['cara edit video', 'capcut', 'tutorial']
      );
      expect(result.checks[6].passed).toBe(true);
    });
  });
  
  describe('calculateKeywordRelevance', () => {
    it('should return high score when keyword appears in title, desc, and tags', () => {
      const score = calculateKeywordRelevance(
        'Cara Edit Video CapCut',
        'Belajar cara edit video CapCut di sini',
        ['cara edit video', 'capcut', 'tutorial']
      );
      expect(score).toBeGreaterThan(50);
    });
    
    it('should return 0 for empty title', () => {
      expect(calculateKeywordRelevance('', 'description', ['tag'])).toBe(0);
    });
  });
  
  describe('calculateKanalisaScore (integration)', () => {
    it('should calculate total score with correct weights', () => {
      const video = {
        viewCount: 100000,
        likeCount: 5000,
        commentCount: 200,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
        title: 'Cara Edit Video CapCut untuk Pemula Lengkap',
        description: 'Deskripsi panjang yang berisi informasi lengkap tentang cara edit video menggunakan CapCut di HP. Tonton sampai habis ya! https://instagram.com/creator #tutorial #capcut #editvideo 00:00 Intro',
      };
      
      const channelStats = {
        avgViewsLast10: 50000,
        medianVPH: 2000,
        categoryMedianEngagement: 0.03,
      };
      
      const result = calculateKanalisaScore(video, channelStats);
      
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.breakdown.speed.weight).toBe(0.35);
      expect(result.breakdown.engagement.weight).toBe(0.25);
      expect(result.breakdown.seo.weight).toBe(0.20);
      expect(result.breakdown.keyword.weight).toBe(0.20);
    });
    
    it('should include meta information', () => {
      const video = {
        viewCount: 100000,
        likeCount: 5000,
        commentCount: 200,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        tags: ['tag1', 'tag2'],
        title: 'Test Title',
        description: 'Test description',
      };
      
      const result = calculateKanalisaScore(video, {});
      
      expect(result.meta).toHaveProperty('vph');
      expect(result.meta).toHaveProperty('engagementRate');
      expect(result.meta).toHaveProperty('titleLength');
      expect(result.meta).toHaveProperty('descriptionLength');
      expect(result.meta).toHaveProperty('tagCount');
    });
  });
});

describe('Scoring Service - Outlier & Earnings', () => {
  describe('calculateOutlierRatio', () => {
    it('should return ratio for outlier (>1.5x)', () => {
      expect(calculateOutlierRatio(300000, 100000)).toBe(3.0);
      expect(calculateOutlierRatio(160000, 100000)).toBe(1.6);
    });
    
    it('should return null for non-outlier', () => {
      expect(calculateOutlierRatio(140000, 100000)).toBeNull();
      expect(calculateOutlierRatio(100000, 100000)).toBeNull();
    });
    
    it('should return null for zero channel avg', () => {
      expect(calculateOutlierRatio(100000, 0)).toBeNull();
    });
  });
  
  describe('estimateEarningsRupiah', () => {
    it('should return range with IDR currency', () => {
      const earnings = estimateEarningsRupiah(100000);
      expect(earnings.currency).toBe('IDR');
      expect(earnings.label).toBe('Estimasi kasar');
      expect(earnings.min).toBeLessThan(earnings.max);
    });
    
    it('should have different ranges per category', () => {
          const tech = estimateEarningsRupiah(100000, 'tech');
          const entertainment = estimateEarningsRupiah(100000, 'entertainment');
      
      expect(tech.min).toBeGreaterThan(entertainment.min);
    });
  });
});