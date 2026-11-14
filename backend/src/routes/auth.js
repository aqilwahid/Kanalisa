import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';

const router = express.Router();

const USE_MOCK = config.GOOGLE_CLIENT_ID === 'test-google-client-id' || !config.GOOGLE_CLIENT_ID;

let oauth2Client = null;
if (!USE_MOCK) {
  oauth2Client = new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET
  );
}

const MOCK_USER = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.png',
  tier: 'free',
  aiCredits: 45,
  keywordQuota: 3,
  googleId: 'mock-google-id',
  createdAt: new Date().toISOString(),
};

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, tier: user.tier, googleId: user.googleId },
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
    
    let googleId, email, name, picture;
    
    if (USE_MOCK) {
      console.log('[MOCK] Google auth - accepting any credential');
      googleId = 'mock-google-id';
      email = 'test@example.com';
      name = 'Test User';
      picture = 'https://example.com/avatar.png';
    } else {
      // Verify Google ID token
      const ticket = await oauth2Client.verifyIdToken({
        idToken: credential,
        audience: config.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ error: 'Invalid Google token' });
      }
      
      ({ sub: googleId, email, name, picture } = payload);
    }
    
    // Get or create user from database
    const userModel = req.userModel;
    console.log('[DEBUG] userModel:', userModel ? 'exists' : 'null');
    console.log('[DEBUG] userModel.getUserByGoogleId:', typeof userModel.getUserByGoogleId);
    
    let user = await userModel.getUserByGoogleId(googleId);
    console.log('[DEBUG] getUserByGoogleId result:', user);
    
    if (!user) {
      console.log('[DEBUG] Creating new user');
      user = await userModel.createUser({ googleId, email, name, avatar: picture });
      console.log('[DEBUG] Created user:', user);
    }
    
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        tier: user.tier,
        aiCredits: user.ai_credits,
        keywordQuota: user.keyword_quota,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    console.error('Google auth stack:', err.stack);
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
    
    // Get fresh user data from database
    const userModel = req.userModel;
    const user = await userModel.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const newToken = generateToken(user);
    
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
    
    const userModel = req.userModel;
    const user = await userModel.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        tier: user.tier,
        aiCredits: user.ai_credits,
        keywordQuota: user.keyword_quota,
        createdAt: user.created_at,
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
    
    const userModel = req.userModel;
    await userModel.deleteUser(decoded.id);
    
    res.json({ success: true, message: 'Account deleted. Confirmation email sent.' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;