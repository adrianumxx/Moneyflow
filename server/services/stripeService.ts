import admin, { getDb } from '../firebaseAdmin.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16' as any,
});

export const handleStripeWebhook = async (payload: Buffer, sig: string, endpointSecret: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  const db = getDb();

  // 1. Idempotency Check: Avoid processing same event twice
  const eventRef = db.collection('processed_stripe_events').doc(event.id);
  const eventSnap = await eventRef.get();
  if (eventSnap.exists) {
    console.log(`[Stripe Webhook] Event already processed: ${event.id}`);
    return { received: true, alreadyProcessed: true };
  }

  // Log event for audit
  console.log(`[Stripe Webhook] Processing event: ${event.id} (type: ${event.type})`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer as string;
      
      if (!userId) {
        console.error(`[Stripe Webhook] Missing client_reference_id in checkout.session.completed: ${event.id}`);
        break;
      }

      await db.collection('users').doc(userId).set({
        stripeCustomerId: customerId,
        subscriptionStatus: 'active',
        plan: 'premium',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log(`[Stripe Webhook] Premium access granted to user: ${userId}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await userDoc.ref.update({
          subscriptionStatus: 'canceled',
          plan: 'basic', // Revoke premium access
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[Stripe Webhook] Subscription deleted for customer: ${customerId}`);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      
      const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const isPremium = ['active', 'trialing'].includes(status);
        
        await userDoc.ref.update({
          subscriptionStatus: status,
          plan: isPremium ? 'premium' : 'basic',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[Stripe Webhook] Subscription updated for customer: ${customerId} to status: ${status}`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      
      const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await userDoc.ref.update({
          subscriptionStatus: 'past_due',
          // We don't revoke premium immediately on one failed payment, 
          // usually wait for Stripe to cancel the subscription after retries.
          // But we mark it so the UI can warn the user.
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[Stripe Webhook] Payment failed for customer: ${customerId}`);
      }
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  // 2. Finalize Idempotency: Mark event as processed
  await eventRef.set({
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    type: event.type
  });

  return { received: true };
};
