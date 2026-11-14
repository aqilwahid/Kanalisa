export const UserSchema = {
  id: 'uuid',
  googleId: 'string',
  email: 'string',
  name: 'string',
  avatar: 'string?',
  tier: 'free | pro | agency',
  billingCycle: 'monthly | yearly | null',
  currentPeriodEnd: 'datetime?',
  cancelAtPeriodEnd: 'boolean',
  aiCredits: 'number',
  keywordQuota: 'number',
  createdAt: 'datetime',
  updatedAt: 'datetime',
};

export const UserQueries = {
  create: `
    INSERT INTO users (google_id, email, name, avatar, tier, ai_credits, keyword_quota)
    VALUES ($1, $2, $3, $4, 'free', 50, 3)
    RETURNING *
  `,
  findByGoogleId: `
    SELECT * FROM users WHERE google_id = $1
  `,
  findById: `
    SELECT * FROM users WHERE id = $1
  `,
  updateTier: `
    UPDATE users 
    SET tier = $2, billing_cycle = $3, current_period_end = $4, 
        ai_credits = $5, keyword_quota = $6, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `,
  updateSubscription: `
    UPDATE users 
    SET cancel_at_period_end = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `,
  delete: `
    DELETE FROM users WHERE id = $1
  `,
};

export function createUserModel(db) {
  return {
    async createUser({ googleId, email, name, avatar, tier = 'free', aiCredits = 50, keywordQuota = 3 }) {
      const result = await db.query(UserQueries.create, [googleId, email, name, avatar, tier, aiCredits, keywordQuota]);
      return result.rows[0];
    },
    
    async getUserByGoogleId(googleId) {
      const result = await db.query(UserQueries.findByGoogleId, [googleId]);
      return result.rows[0] || null;
    },
    
    async getUserById(id) {
      const result = await db.query(UserQueries.findById, [id]);
      return result.rows[0] || null;
    },
    
    async updateUserTier(id, tier, billingCycle, currentPeriodEnd, aiCredits, keywordQuota) {
      const result = await db.query(UserQueries.updateTier, [id, tier, billingCycle, currentPeriodEnd, aiCredits, keywordQuota]);
      return result.rows[0];
    },
    
    async updateUserSubscription(id, { cancelAtPeriodEnd }) {
      const result = await db.query(UserQueries.updateSubscription, [id, cancelAtPeriodEnd]);
      return result.rows[0];
    },
    
    async deleteUser(id) {
      await db.query(UserQueries.delete, [id]);
    },
  };
}