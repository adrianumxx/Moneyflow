import './env.js';
import Stripe from 'stripe';
import helmet from 'helmet';
import cors from 'cors';
import express from 'express';

import admin, { getDb } from '../server/firebaseAdmin.js';
import { handleStripeWebhook } from '../server/services/stripeService.js';
import cryptoRoutes from '../server/routes/cryptoRoutes.js';
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeKey || 'sk_test_dummy_key_for_local_dev', {
  apiVersion: '2023-10-16' as any,
});

const app = express();
 
// 1. Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Strict CSP deferred to avoid Vite build breakages
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: { action: "deny" } // Mitigates Clickjacking
}));
 
// 2. CORS Hardening
const allowedOrigins = [
  process.env.VITE_APP_URL,
  process.env.APP_URL,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean) as string[];
 
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Stripe Webhook (PUBLIC - signature verified, NO AUTH)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing stripe-signature or endpointSecret');
    }
    const result = await handleStripeWebhook(req.body, sig as string, endpointSecret);
    res.json(result);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(express.json());

// Import Auth Middleware
import { authMiddleware, AuthenticatedRequest } from '../server/middleware/authMiddleware.js';
import { rateLimit } from 'express-rate-limit';

/**
 * Neural Core Rate Limiter
 * Protects expensive AI endpoints from exhaustion.
 * Limit: 30 requests per 15 minutes per IP.
 */
const geminiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 30, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Neural Core is temporarily busy. Please try again in 15 minutes.' }
});
 
/**
 * Sync Service Rate Limiter
 * Protects banking sync routes from abuse.
 * Limit: 60 requests per 15 minutes per IP.
 */
const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 60, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Sync service is temporarily rate limited. Please try again later.' }
});

// PROTECTED ROUTES (Require Firebase ID Token)
import geminiRoutes from '../server/routes/geminiRoutes.js';
import syncRoutes from '../server/routes/syncRoutes.js';
import userRoutes from '../server/routes/userRoutes.js';
import cryptoRoutes from '../server/routes/cryptoRoutes.js';

/**
 * Data Erasure Rate Limiter
 * Limits audit requests to prevent intelligence gathering/scraping via error messages or counts.
 * Limit: 5 requests per hour per IP.
 */
const purgeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Data audit limit reached. Please try again in an hour.' }
});

/**
 * Destructive Purge Rate Limiter
 * Heavy restriction on data erasure.
 * Limit: 1 request per 24 hours per IP.
 */
const destructivePurgeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, 
  max: 1, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Data erasure already requested today. Please try again later.' }
});

app.use('/api/gemini', geminiLimiter, authMiddleware, geminiRoutes);
app.use('/api/sync', syncLimiter, authMiddleware, syncRoutes);
app.use('/api/crypto', authMiddleware, cryptoRoutes);
app.use('/api/user/purge/dry-run', purgeLimiter); 
app.post('/api/user/purge', destructivePurgeLimiter); 
app.use('/api/user', authMiddleware, userRoutes);

/**
 * Production Health Endpoint
 * Public route for monitoring service availability.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'moneyflow-api',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * System Diagnostics Endpoint (Protected)
 * Returns configuration status without exposing secrets.
 */
app.get('/api/system/status', authMiddleware, (req, res) => {
  res.json({
    firebaseAdminConfigured: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    gocardlessConfigured: !!(process.env.GOCARDLESS_SECRET_ID && process.env.GOCARDLESS_SECRET_KEY),
    stripeConfigured: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    newsProviderEnabled: !!process.env.NEWS_PROVIDER,
    appUrlConfigured: !!process.env.APP_URL,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.post('/api/create-checkout-session', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  const { userEmail } = req.body;
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing UID' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price: process.env.VITE_STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID_MONTHLY || 'price_placeholder',
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7, 
      },
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/?billing=success`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/?billing=cancel`,
      client_reference_id: userId,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('CRITICAL STRIPE ERROR:', error.message);
    res.status(500).json({ error: 'Failed to initiate checkout session.' });
  }
});

app.post('/api/create-portal-session', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing UID' });

  try {
    const userDoc = await getDb().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.stripeCustomerId) {
      return res.status(400).json({ error: 'User does not have a Stripe customer ID' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    res.status(500).json({ error: 'Failed to open billing portal.' });
  }
});

// For Vercel, we export the app
export default app;

