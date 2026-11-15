import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const TIER_PLANS = {
  pro: {
    monthly: { price: 49000, credits: 1500, keywordQuota: Infinity, maxCompetitors: 10 },
    yearly: { price: 399000, credits: 1500, keywordQuota: Infinity, maxCompetitors: 10 },
  },
  agency: {
    monthly: { price: 299000, credits: 6000, keywordQuota: Infinity, maxCompetitors: 50 },
  },
};

function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'] || req.headers['x-midtrans-signature'];
    const payload = req.body.toString();

    if (!config.PAYMENT_GATEWAY_WEBHOOK_SECRET) {
      if (config.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Webhook secret belum dikonfigurasi' });
      }
      // Mode development tanpa secret
    } else {
      const expectedSignature = crypto
        .createHmac('sha256', config.PAYMENT_GATEWAY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      if (!safeCompare(signature, expectedSignature)) {
        return res.status(401).json({ error: 'Signature webhook tidak valid' });
      }
    }

    let event;
    try {
      event = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: 'Payload bukan JSON valid' });
    }

    const { user_id, plan, billing_cycle } = event.metadata || {};

    if (event.event_type === 'payment_success' || event.transaction_status === 'settlement') {
      if (!user_id || !plan) {
        return res.status(400).json({ error: 'Metadata user_id atau plan tidak lengkap' });
      }

      const userModel = req.userModel;
      await userModel.updateTier(user_id, plan, billing_cycle);
    }

    if (event.event_type === 'subscription_cancelled' || event.transaction_status === 'cancel') {
      if (user_id) {
        const userModel = req.userModel;
        await userModel.updateTier(user_id, 'free', null);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Billing webhook error:', err.message);
    res.status(500).json({ error: 'Pemrosesan webhook gagal' });
  }
});

router.get('/plans', (req, res) => {
  res.json({
    plans: {
      free: {
        name: 'Gratis',
        price: 0,
        features: [
          'Overlay video & Skor Kanalisa',
          'Tag video & checklist SEO',
          '3 riset kata kunci per hari',
          '50 kredit AI per bulan',
        ],
      },
      pro: {
        name: 'Pro',
        monthly: TIER_PLANS.pro.monthly,
        yearly: TIER_PLANS.pro.yearly,
        features: [
          'Semua fitur paket Gratis',
          'Riset kata kunci tak terbatas',
          'Rincian Skor Kanalisa & analisis outlier',
          '10 kanal kompetitor',
          '1.500 kredit AI per bulan',
          'Estimasi pendapatan Rupiah per kategori',
          'Rekomendasi jam unggah optimal',
        ],
      },
      agency: {
        name: 'Agensi',
        monthly: TIER_PLANS.agency.monthly,
        features: [
          'Semua fitur paket Pro',
          'Hingga 10 kanal YouTube',
          '50 kanal kompetitor',
          '6.000 kredit AI per bulan',
          'Ekspor laporan analitik CSV/PDF',
        ],
      },
    },
  });
});

router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly' } = req.body;

    if (!plan || !TIER_PLANS[plan]) {
      return res.status(400).json({ error: 'Paket langganan tidak valid' });
    }

    const planData = TIER_PLANS[plan][billingCycle];
    if (!planData) {
      return res.status(400).json({ error: 'Siklus tagihan tidak valid' });
    }

    const orderId = `kanalisa-${plan}-${req.user.id.slice(0, 8)}-${Date.now()}`;

    res.json({
      orderId,
      amount: planData.price,
      currency: 'IDR',
      plan,
      billingCycle,
      checkoutUrl: `/api/billing/pay/${orderId}`,
      message: 'Simulasi checkout berhasil dibuat. Integrasi payment gateway lokal (Midtrans/Xendit) siap disambungkan.',
    });
  } catch (err) {
    console.error('Create checkout error:', err.message);
    res.status(500).json({ error: 'Gagal membuat tagihan' });
  }
});

router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const userModel = req.userModel;
    const user = await userModel.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({
      tier: user.tier || 'free',
      billingCycle: user.billing_cycle ?? user.billingCycle ?? null,
      currentPeriodEnd: user.current_period_end ?? user.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: user.cancel_at_period_end ?? user.cancelAtPeriodEnd ?? false,
    });
  } catch (err) {
    console.error('Get subscription error:', err.message);
    res.status(500).json({ error: 'Gagal memuat status langganan' });
  }
});

router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const userModel = req.userModel;
    await userModel.updateSubscription(req.user.id, { cancelAtPeriodEnd: true });

    res.json({ success: true, message: 'Langganan Anda akan dibatalkan pada akhir periode penagihan aktif.' });
  } catch (err) {
    console.error('Cancel subscription error:', err.message);
    res.status(500).json({ error: 'Gagal membatalkan langganan' });
  }
});

export default router;
