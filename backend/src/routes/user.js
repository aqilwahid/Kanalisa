import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const MOCK_USER = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.png',
  tier: 'free',
  aiCredits: 45,
  keywordQuota: 3,
  createdAt: new Date().toISOString(),
};

router.get('/me', authMiddleware, async (req, res) => {
  try {
    console.log('[MOCK] GET /api/user/me called');
    
    res.json({ user: MOCK_USER });
  } catch (err) {
    console.error('Get user me error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;