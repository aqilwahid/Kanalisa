import express from 'express';
import crypto from 'crypto';
import { config } from '../config.js';

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

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'] || req.headers['x-midtrans-signature'];
    const payload = req.body.toString();
    
    const expectedSignature = crypto
      .createHmac('sha256', config.PAYMENT_GATEWAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = JSON.parse(payload);
    
    if (event.event_type === 'payment_success' || event.transaction_status === 'settlement') {
      const { user_id, plan, billing_cycle } = event.metadata || {};
      
      if (!user_id || !plan) {
        console.warn('Missing metadata in webhook:', event);
        return res.status(400).json({ error: 'Invalid metadata' });
      }
      
      await req.db.updateUserTier(user_id, plan, billing_cycle);
      
      console.log(`User ${user_id} upgraded to ${plan} (${billing_cycle})`);
    }
    
    if (event.event_type === 'subscription_cancelled' || event.transaction_status === 'cancel') {
      const { user_id } = event.metadata || {};
      if (user_id) {
        await req.db.updateUserTier(user_id, 'free', null);
        console.log(`User ${user_id} downgraded to free`);
      }
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Billing webhook error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.get('/plans', (req, res) => {
  res.json({
    plans: {
      free: {
        name: 'Gratis',
        price: 0,
        features: [
          'Overlay video & skor dasar',
          'Tag video & checklist SEO',
          '3 riset keyword/hari',
          '50 kredit AI/bulan',
        ],
      },
      pro: {
        name: 'Pro',
        monthly: TIER_PLANS.pro.monthly,
        yearly: TIER_PLANS.pro.yearly,
        features: [
          'Semua fitur Gratis',
          'Riset keyword tak terbatas',
          'Rincian skor & outlier',
          '10 kompetitor',
          '1.500 kredit AI/bulan',
          'Estimasi pendapatan Rupiah',
          'Jam unggah optimal',
        ],
      },
      agency: {
        name: 'Agensi',
        monthly: TIER_PLANS.agency.monthly,
        features: [
          'Semua fitur Pro',
          'Hingga 10 kanal',
          '50 kompetitor',
          '6.000 kredit AI/bulan',
          'Ekspor laporan CSV/PDF',
          'Multi-user (akan datang)',
        ],
      },
    },
  });
});

router.post('/create-checkout', async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly' } = req.body;
    
    if (!plan || !TIER_PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    
    const planData = TIER_PLANS[plan][billingCycle];
    if (!planData) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.slice(7);
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, config.JWT_SECRET);
    
    const orderId = `kanalisa-${plan}-${decoded.id}-${Date.now()}`;
    
    const checkoutData = {
      orderId,
      amount: planData.price,
      currency: 'IDR',
      customer: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      },
      metadata: {
        user_id: decoded.id,
        plan,
        billing_cycle: billingCycle,
      },
      callbackUrl: `${config.FRONTEND_URL}/settings?payment=success`,
    };
    
    res.json({ checkoutUrl: `/api/billing/pay/${orderId}`, orderId });
  } catch (err) {
    console.error('Create checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

router.get('/subscription', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.slice(7);
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, config.JWT_SECRET);
    
    const user = await req.db.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      tier: user.tier,
      billingCycle: user.billingCycle,
      currentPeriodEnd: user.currentPeriodEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    });
  } catch (err) {
    console.error('Get subscription error:', err.message);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.post('/cancel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.slice(7);
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, config.JWT_SECRET);
    
    await req.db.updateUserSubscription(decoded.id, { cancelAtPeriodEnd: true });
    
    res.json({ success: true, message: 'Subscription will cancel at period end' });
  } catch (err) {
    console.error('Cancel subscription error:', err.message);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;