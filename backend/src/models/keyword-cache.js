export const KeywordCacheSchema = {
  id: 'uuid',
  query: 'string',
  normalizedQuery: 'string',
  results: 'jsonb',
  expiresAt: 'datetime',
  createdAt: 'datetime',
};

export const KeywordCacheQueries = {
  create: `
    INSERT INTO keyword_cache (query, normalized_query, results, expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (normalized_query) DO UPDATE SET
      results = EXCLUDED.results,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
    RETURNING *
  `,
  findByQuery: `
    SELECT * FROM keyword_cache WHERE normalized_query = $1 AND expires_at > NOW()
  `,
  deleteExpired: `
    DELETE FROM keyword_cache WHERE expires_at <= NOW()
  `,
};

export function createKeywordCacheModel(db) {
  return {
    async get(query) {
      const normalized = query.toLowerCase().trim();
      const result = await db.query(KeywordCacheQueries.findByQuery, [normalized]);
      return result.rows[0]?.results || null;
    },
    
    async set(query, results, ttlHours = 24) {
      const normalized = query.toLowerCase().trim();
      const expiresAt = new Date(Date.now() + ttlHours * 3600000);
      const result = await db.query(KeywordCacheQueries.create, [query, normalized, JSON.stringify(results), expiresAt]);
      return result.rows[0];
    },
    
    async cleanup() {
      await db.query(KeywordCacheQueries.deleteExpired);
    },
  };
}