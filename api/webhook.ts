import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { db, admin } from './_lib/firebase-admin';

// Vercel config to disable body parsing for raw Stripe events
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-11-preview' as any,
});

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).send('Webhook Error: Missing signature or secret');
  }

  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
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

  return res.json({ received: true });
}
