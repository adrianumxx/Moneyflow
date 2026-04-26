import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-11-preview' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, userEmail } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

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
        trial_period_days: 15,
      },
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/?billing=success`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/?billing=cancel`,
      client_reference_id: userId,
    });

    return res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
