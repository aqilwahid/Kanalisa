import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

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

function generateMockToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, tier: user.tier, googleId: 'mock-google-id' },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }
    
    // Mock: accept any credential and return mock user
    console.log('Mock Google auth - credential received');
    
    const token = generateMockToken(MOCK_USER);
    
    res.json({
      token,
      user: {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
        avatar: MOCK_USER.avatar,
        tier: MOCK_USER.tier,
        aiCredits: MOCK_USER.aiCredits,
        keywordQuota: MOCK_USER.keywordQuota,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token required' });
    }
    
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.JWT_SECRET, { ignoreExpiration: true });
    
    // Mock: return new token for mock user
    const newToken = generateMockToken(MOCK_USER);
    
    res.json({ token: newToken });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token required' });
    }
    
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Mock: return mock user
    res.json({
      user: {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
        avatar: MOCK_USER.avatar,
        tier: MOCK_USER.tier,
        aiCredits: MOCK_USER.aiCredits,
        keywordQuota: MOCK_USER.keywordQuota,
        createdAt: MOCK_USER.createdAt,
      },
    });
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.delete('/account', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token required' });
    }
    
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Mock: just return success
    res.json({ success: true, message: 'Account deleted. Confirmation email sent.' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;