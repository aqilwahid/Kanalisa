import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config, modes } from '../config.js';

const router = express.Router();

export const isMockAuth = modes.auth === 'mock';

let oauth2Client = null;
if (!isMockAuth) {
  oauth2Client = new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET
  );
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, tier: user.tier || 'free', googleId: user.google_id || user.googleId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

router.get('/config', (req, res) => {
  res.json({
    googleClientId: config.GOOGLE_CLIENT_ID || '',
    authMode: modes.auth,
  });
});

router.post('/google', async (req, res) => {
  try {
    const { credential, code, redirectUri } = req.body;

    if (!credential && !code) {
      return res.status(400).json({ error: 'Google credential atau authorization code wajib disertakan' });
    }

    let googleId, email, name, picture;

    if (isMockAuth || credential === 'dev-mock') {
      googleId = 'mock-google-id-001';
      email = 'test@example.com';
      name = 'Pengguna Kanalisa (Dev)';
      picture = 'https://lh3.googleusercontent.com/a/default-user';
    } else {
      let idTokenToVerify = credential;

      if (code) {
        const { tokens } = await oauth2Client.getToken({
          code,
          redirect_uri: redirectUri || 'https://api.kanalisa.id',
        });
        idTokenToVerify = tokens.id_token;
      }

      if (!idTokenToVerify) {
        return res.status(401).json({ error: 'Tidak dapat memperoleh ID token dari Google' });
      }

      const ticket = await oauth2Client.verifyIdToken({
        idToken: idTokenToVerify,
        audience: config.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ error: 'Token Google tidak valid' });
      }

      ({ sub: googleId, email, name, picture } = payload);
    }

    const userModel = req.userModel;
    let user = await userModel.getUserByGoogleId(googleId);

    if (!user) {
      user = await userModel.createUser({
        googleId,
        email,
        name,
        avatar: picture,
        tier: 'free',
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        tier: user.tier || 'free',
        aiCredits: user.ai_credits ?? user.aiCredits ?? 50,
        keywordQuota: user.keyword_quota ?? user.keywordQuota ?? 3,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(500).json({ error: 'Autentikasi Google gagal: ' + err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token otorisasi diperlukan' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.JWT_SECRET, { ignoreExpiration: true });

    const userModel = req.userModel;
    const user = await userModel.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Pengguna tidak ditemukan' });
    }

    const newToken = generateToken(user);
    res.json({ token: newToken });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(401).json({ error: 'Token tidak valid' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token otorisasi diperlukan' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.JWT_SECRET);

    const userModel = req.userModel;
    const user = await userModel.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Pengguna tidak ditemukan' });
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
    console.error('Get me error:', err.message);
    res.status(401).json({ error: 'Token tidak valid' });
  }
});

router.delete('/account', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token otorisasi diperlukan' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.JWT_SECRET);

    const userModel = req.userModel;
    await userModel.deleteUser(decoded.id);

    res.json({ success: true, message: 'Akun dan data Anda berhasil dihapus sesuai UU PDP.' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Gagal menghapus akun' });
  }
});

export default router;
