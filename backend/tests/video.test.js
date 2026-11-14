import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeVideo, normalizeChannel } from '../src/services/youtube.js';
import { calculateKanalisaScore, calculateOutlierRatio, estimateEarningsRupiah } from '../src/services/scoring.js';

describe('YouTube Service - normalizeVideo', () => {
  it('should normalize video with all fields', () => {
    const rawVideo = {
      id: 'test123',
      snippet: {
        title: 'Test Video',
        description: 'Test description',
        publishedAt: '2024-01-15T10:00:00Z',
        channelId: 'UC123',
        channelTitle: 'Test Channel',
        tags: ['tag1', 'tag2'],
        thumbnails: { default: { url: 'thumb.jpg' } },
      },
      statistics: {
        viewCount: '100000',
        likeCount: '5000',
        commentCount: '100',
      },
      contentDetails: {
        duration: 'PT10M30S',
      },
    };
    
    const result = normalizeVideo(rawVideo);
    
    expect(result.id).toBe('test123');
    expect(result.title).toBe('Test Video');
    expect(result.viewCount).toBe(100000);
    expect(result.likeCount).toBe(5000);
    expect(result.commentCount).toBe(100);
    expect(result.tags).toEqual(['tag1', 'tag2']);
    expect(result.duration).toBe('PT10M30S');
  });
  
  it('should handle missing optional fields', () => {
    const rawVideo = {
      id: 'test123',
      snippet: {
        title: 'Test Video',
      },
      statistics: {},
      contentDetails: {},
    };
    
    const result = normalizeVideo(rawVideo);
    
    expect(result.viewCount).toBe(0);
    expect(result.likeCount).toBe(0);
    expect(result.commentCount).toBe(0);
    expect(result.tags).toEqual([]);
  });
  
  it('should return null for null input', () => {
    expect(normalizeVideo(null)).toBeNull();
  });
});

describe('YouTube Service - normalizeChannel', () => {
  it('should normalize channel with all fields', () => {
    const rawChannel = {
      id: 'UC123',
      snippet: {
        title: 'Test Channel',
        description: 'Channel description',
        publishedAt: '2023-01-01T00:00:00Z',
        thumbnails: { default: { url: 'thumb.jpg' } },
      },
      statistics: {
        subscriberCount: '50000',
        videoCount: '100',
        viewCount: '5000000',
      },
    };
    
    const result = normalizeChannel(rawChannel);
    
    expect(result.id).toBe('UC123');
    expect(result.title).toBe('Test Channel');
    expect(result.subscriberCount).toBe(50000);
    expect(result.videoCount).toBe(100);
    expect(result.viewCount).toBe(5000000);
  });
});

describe('Scoring Service - calculateKanalisaScore', () => {
  it('should calculate score for typical video', () => {
    const video = {
      viewCount: 100000,
      likeCount: 5000,
      commentCount: 200,
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      title: 'Cara Edit Video CapCut untuk Pemula Lengkap',
      description: 'Deskripsi panjang yang berisi informasi lengkap tentang cara edit video menggunakan CapCut di HP. Tonton sampai habis ya! https://instagram.com/creator #tutorial #capcut #editvideo',
    };
    
    const channelStats = {
      avgViewsLast10: 50000,
      medianVPH: 2000,
      categoryMedianEngagement: 0.03,
    };
    
    const result = calculateKanalisaScore(video, channelStats);
    
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.breakdown).toHaveProperty('speed');
    expect(result.breakdown).toHaveProperty('engagement');
    expect(result.breakdown).toHaveProperty('seo');
    expect(result.breakdown).toHaveProperty('keyword');
    expect(result.meta).toHaveProperty('vph');
    expect(result.meta).toHaveProperty('engagementRate');
  });
  
  it('should return 0 for video with no views', () => {
    const video = {
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      publishedAt: new Date().toISOString(),
      tags: [],
      title: 'Test',
      description: '',
    };
    
    const result = calculateKanalisaScore(video, {});
    
    expect(result.total).toBe(0);
    expect(result.meta.engagementRate).toBe(0);
  });
  
  it('should calculate SEO checks correctly', () => {
    const video = {
      viewCount: 1000,
      likeCount: 50,
      commentCount: 10,
      publishedAt: new Date().toISOString(),
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      title: 'Cara Edit Video CapCut untuk Pemula Lengkap',
      description: 'Deskripsi panjang yang berisi informasi lengkap tentang cara edit video menggunakan CapCut di HP. Tonton sampai habis ya! https://instagram.com/creator #tutorial #capcut #editvideo 00:00 Intro 01:30 Step 1',
    };
    
    const result = calculateKanalisaScore(video, {});
    
    expect(result.breakdown.seo.checks).toBeDefined();
    expect(result.breakdown.seo.checks.length).toBeGreaterThanOrEqual(6);
  });
});

describe('Scoring Service - calculateOutlierRatio', () => {
  it('should return ratio for outlier video', () => {
    const ratio = calculateOutlierRatio(500000, 100000);
    expect(ratio).toBe(5.0);
  });
  
  it('should return null for non-outlier', () => {
    const ratio = calculateOutlierRatio(120000, 100000);
    expect(ratio).toBeNull();
  });
  
  it('should return null for zero channel avg', () => {
    const ratio = calculateOutlierRatio(100000, 0);
    expect(ratio).toBeNull();
  });
});

describe('Scoring Service - estimateEarningsRupiah', () => {
  it('should return earnings range for general category', () => {
    const earnings = estimateEarningsRupiah(100000, 'general');
    
    expect(earnings.min).toBeGreaterThan(0);
    expect(earnings.max).toBeGreaterThan(earnings.min);
    expect(earnings.currency).toBe('IDR');
    expect(earnings.label).toBe('Estimasi kasar');
  });
  
  it('should return higher range for tech category', () => {
    const general = estimateEarningsRupiah(100000, 'general');
    const tech = estimateEarningsRupiah(100000, 'tech');
    
    expect(tech.min).toBeGreaterThan(general.min);
    expect(tech.max).toBeGreaterThan(general.max);
  });
});