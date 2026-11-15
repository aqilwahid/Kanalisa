import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userModel = req.userModel;
    const user = await userModel.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        tier: user.tier || 'free',
        aiCredits: user.ai_credits ?? user.aiCredits ?? 50,
        keywordQuota: user.keyword_quota ?? user.keywordQuota ?? 3,
        createdAt: user.created_at ?? user.createdAt,
      },
    });
  } catch (err) {
    console.error('Get user me error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;