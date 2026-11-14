import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';

const router = express.Router();
const googleClient = new OAuth2Client();

const TIER_DEFAULTS = {
  free: { aiCredits: 50, keywordQuota: 3 },
  pro: { aiCredits: 1500, keywordQuota: Infinity },
  agency: { aiCredits: 6000, keywordQuota: Infinity },
};

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email_verified) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    
    const { sub: googleId, email, name, picture } = payload;
    
    let user = await req.db.getUserByGoogleId(googleId);
    
    if (!user) {
      user = await req.db.createUser({
        googleId,
        email,
        name,
        avatar: picture,
        tier: 'free',
        aiCredits: TIER_DEFAULTS.free.aiCredits,
        keywordQuota: TIER_DEFAULTS.free.keywordQuota,
      });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, tier: user.tier, googleId: user.googleId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        tier: user.tier,
        aiCredits: user.aiCredits,
        keywordQuota: user.keywordQuota,
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
    
    const user = await req.db.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const newToken = jwt.sign(
      { id: user.id, email: user.email, tier: user.tier, googleId: user.googleId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
    
    res.json({ token });
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
    
    const user = await req.db.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        tier: user.tier,
        aiCredits: user.aiCredits,
        keywordQuota: user.keywordQuota,
        createdAt: user.createdAt,
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
    
    await req.db.deleteUser(decoded.id);
    
    res.json({ success: true, message: 'Account deleted. Confirmation email sent.' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;