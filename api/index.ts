import express from 'express';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId
      });
      console.log('Firebase Admin initialized with Service Account.');
    } else {
      admin.initializeApp({
        projectId: projectId || 'remixed-project-id'
      });
      console.log('Firebase Admin initialized with Project ID only (Default Credentials).');
    }
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
  }
}

const db = admin.firestore();
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeKey || 'sk_test_dummy_key_for_local_dev', {
  apiVersion: '2023-10-16' as any,
});

const app = express();

// Stripe Webhook (PUBLIC - signature verified, NO AUTH)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing stripe-signature or endpointSecret');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer as string;
      
      if (userId) {
        await db.collection('users').doc(userId).set({
          stripeCustomerId: customerId,
          subscriptionStatus: 'active',
          plan: 'premium',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
      break;
    }
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      
      const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await userDoc.ref.update({
          subscriptionStatus: status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      break;
    }
  }

  res.json({ received: true });
});

app.use(express.json());

// Import Auth Middleware
import { authMiddleware, AuthenticatedRequest } from './authMiddleware';

// PROTECTED ROUTES (Require Firebase ID Token)
import geminiRoutes from './geminiRoutes';
import syncRoutes from './syncRoutes';
app.use('/api/gemini', authMiddleware, geminiRoutes);
app.use('/api/sync', authMiddleware, syncRoutes);

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
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-portal-session', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.uid;
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing UID' });

  try {
    const userDoc = await db.collection('users').doc(userId).get();
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
    res.status(500).json({ error: error.message });
  }
});

// For Vercel, we export the app
export default app;

