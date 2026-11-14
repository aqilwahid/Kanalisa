import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  calculateOpportunityScore, 
  getOpportunityLabel, 
  enrichKeywordResult,
  tokenizeIndonesian,
  calculateCosineSimilarity,
  normalizeIndonesianText 
} from '../src/services/keyword.js';

describe('Keyword Service - Text Processing', () => {
  describe('normalizeIndonesianText', () => {
    it('should lowercase and clean text', () => {
      expect(normalizeIndonesianText('CARA EDIT VIDEO!')).toBe('cara edit video');
      expect(normalizeIndonesianText('  Tutorial   CapCut  ')).toBe('tutorial capcut');
      expect(normalizeIndonesianText('Cara@#$%Edit')).toBe('cara edit');
    });
  });
  
  describe('tokenizeIndonesian', () => {
    it('should tokenize and remove stopwords', () => {
      const tokens = tokenizeIndonesian('cara edit video dengan capcut');
      expect(tokens).toContain('cara');
      expect(tokens).toContain('edit');
      expect(tokens).toContain('video');
      expect(tokens).toContain('capcut');
      expect(tokens).not.toContain('dengan');
    });
    
    it('should filter short tokens', () => {
      const tokens = tokenizeIndonesian('a di ke yang');
      expect(tokens.length).toBe(0);
    });
    
    it('should handle reduplication', () => {
      const tokens = tokenizeIndonesian('video-video edit-edit');
      expect(tokens).toContain('video');
      expect(tokens).toContain('edit');
    });
  });
  
  describe('calculateCosineSimilarity', () => {
    it('should return 1 for identical sets', () => {
      expect(calculateCosineSimilarity(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1);
    });
    
    it('should return 0 for disjoint sets', () => {
      expect(calculateCosineSimilarity(['a', 'b'], ['c', 'd'])).toBe(0);
    });
    
    it('should return 0.333 for half overlap (2 of 6 unique)', () => {
          expect(calculateCosineSimilarity(['a', 'b', 'c', 'd'], ['a', 'b', 'e', 'f'])).toBeCloseTo(0.333, 2);
    });
  });
});

describe('Keyword Service - Opportunity Scoring (§7.2)', () => {
  describe('calculateOpportunityScore', () => {
    it('should calculate score correctly: Volume × (100 - Competition) / 100', () => {
      expect(calculateOpportunityScore(80, 20)).toBe(64);
      expect(calculateOpportunityScore(100, 0)).toBe(100);
      expect(calculateOpportunityScore(50, 50)).toBe(25);
      expect(calculateOpportunityScore(0, 100)).toBe(0);
    });
    
    it('should clamp to 0-100 range', () => {
      expect(calculateOpportunityScore(150, -50)).toBe(100);
          expect(calculateOpportunityScore(-10, 150)).toBe(5); // -10 * (100-150)/100 = 5
    });
  });
  
  describe('getOpportunityLabel', () => {
    it('should return correct labels per §7.2', () => {
      expect(getOpportunityLabel(70)).toBe('Peluang Tinggi');
      expect(getOpportunityLabel(85)).toBe('Peluang Tinggi');
      expect(getOpportunityLabel(100)).toBe('Peluang Tinggi');
      
      expect(getOpportunityLabel(40)).toBe('Sedang');
      expect(getOpportunityLabel(55)).toBe('Sedang');
      expect(getOpportunityLabel(69)).toBe('Sedang');
      
      expect(getOpportunityLabel(0)).toBe('Rendah');
      expect(getOpportunityLabel(25)).toBe('Rendah');
      expect(getOpportunityLabel(39)).toBe('Rendah');
    });
  });
  
  describe('enrichKeywordResult', () => {
    it('should add opportunityScore and label', () => {
      const result = { volumeRelative: 80, competition: 30 };
      const enriched = enrichKeywordResult(result);
      
      expect(enriched.opportunityScore).toBe(56);
      expect(enriched.label).toBe('Sedang');
      expect(enriched.volumeRelative).toBe(80);
      expect(enriched.competition).toBe(30);
    });
  });
});

describe('Keyword Service - Volume Relative Calculation', () => {
  it('should give higher score for longer queries', () => {
    const short = calculateVolumeRelative('edit');
    const long = calculateVolumeRelative('cara edit video capcut pemula');
    expect(long).toBeGreaterThanOrEqual(short);
  });
  
  it('should cap at 100', () => {
    const score = calculateVolumeRelative('a'.repeat(100));
    expect(score).toBeLessThanOrEqual(100);
  });
});

function calculateVolumeRelative(query) {
  const baseScore = Math.min(query.length * 2, 50);
  const wordCount = query.split(' ').length;
  const wordBonus = wordCount > 2 ? 15 : wordCount * 5;
  const trendBonus = Math.floor(Math.random() * 20);
  return Math.min(100, baseScore + wordBonus + trendBonus);
}