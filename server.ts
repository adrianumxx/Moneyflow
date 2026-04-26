import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// In AI Studio, we can usually just call initializeApp() if it's running in GCP with default credentials
// or we can use the project ID from our config.
try {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'remixed-project-id' 
  });
} catch (e) {
  console.log('Firebase Admin already initialized or failed:', e);
}

const db = admin.firestore();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-11-preview' as any,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Webhook (MUST be before express.json() to get raw body)
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

    // Handle the event
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

  // API Routes
  app.post('/api/create-checkout-session', async (req, res) => {
    const { userId, userEmail } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: userEmail,
        line_items: [
          {
            price: process.env.VITE_STRIPE_PRICE_ID_MONTHLY,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: 15, // 15-day free trial as requested
        },
        success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/?billing=success`,
        cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/?billing=cancel`,
        client_reference_id: userId,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Stripe Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/create-portal-session', async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
