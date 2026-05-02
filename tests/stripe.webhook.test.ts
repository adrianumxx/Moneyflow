import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleStripeWebhook } from '../server/services/stripeService';
import Stripe from 'stripe';

// Mock Firebase Admin
const mockUpdate = vi.fn().mockResolvedValue({});
const mockSet = vi.fn().mockResolvedValue({});
const mockDoc = vi.fn().mockReturnValue({
  set: mockSet,
  update: mockUpdate,
  get: vi.fn().mockResolvedValue({ exists: false })
});
const mockGet = vi.fn().mockResolvedValue({
  empty: false,
  docs: [{
    id: 'user_123',
    ref: { update: mockUpdate }
  }]
});
const mockWhere = vi.fn().mockReturnValue({
  limit: vi.fn().mockReturnValue({
    get: mockGet
  })
});

vi.mock('../server/firebaseAdmin', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn().mockReturnValue({
      doc: mockDoc,
      where: mockWhere
    })
  })),
  default: {
    firestore: {
      FieldValue: {
        serverTimestamp: vi.fn(() => 'mock-timestamp')
      }
    }
  }
}));

// Mock Stripe
const { mockConstructEvent } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn()
}));

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: mockConstructEvent
      }
    }))
  };
});

describe('Stripe Webhook Service', () => {
  const endpointSecret = 'whsec_test';
  const sig = 'mock_sig';
  const payload = Buffer.from(JSON.stringify({ id: 'evt_123' }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Signature Verification', () => {
    it('should throw error if signature verification fails', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(handleStripeWebhook(payload, sig, endpointSecret))
        .rejects.toThrow('Webhook signature verification failed: Invalid signature');
    });

    it('should throw error if signature is missing', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('No signature provided');
      });

      await expect(handleStripeWebhook(payload, '', endpointSecret))
        .rejects.toThrow('Webhook signature verification failed: No signature provided');
    });

    it('should throw error if endpoint secret is missing', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('No endpoint secret provided');
      });

      await expect(handleStripeWebhook(payload, sig, ''))
        .rejects.toThrow('Webhook signature verification failed: No endpoint secret provided');
    });
  });

  describe('Event Handling', () => {
    it('should handle checkout.session.completed and grant premium access', async () => {
      const mockEvent = {
        id: 'evt_checkout',
        type: 'checkout.session.completed',
        data: {
          object: {
            client_reference_id: 'user_123',
            customer: 'cus_123'
          }
        }
      };

      mockConstructEvent.mockReturnValue(mockEvent as any);

      const result = await handleStripeWebhook(payload, sig, endpointSecret);

      expect(result).toEqual({ received: true });
      expect(mockDoc).toHaveBeenCalledWith('user_123');
      expect(mockSet).toHaveBeenCalledWith({
        stripeCustomerId: 'cus_123',
        subscriptionStatus: 'active',
        plan: 'premium',
        updatedAt: 'mock-timestamp'
      }, { merge: true });
    });

    it('should log error if client_reference_id is missing in checkout', async () => {
      const mockEvent = {
        id: 'evt_checkout_no_id',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123'
          }
        }
      };

      mockConstructEvent.mockReturnValue(mockEvent as any);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handleStripeWebhook(payload, sig, endpointSecret);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Missing client_reference_id'));
      // Note: mockDoc IS called now for the idempotency check (event.id)
      // We check it wasn't called for a user document (which would happen if userId existed)
      expect(mockDoc).not.toHaveBeenCalledWith('user_123');
    });

    it('should handle customer.subscription.deleted and revoke premium', async () => {
      const mockEvent = {
        id: 'evt_deleted',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_123'
          }
        }
      };

      mockConstructEvent.mockReturnValue(mockEvent as any);

      await handleStripeWebhook(payload, sig, endpointSecret);

      expect(mockWhere).toHaveBeenCalledWith('stripeCustomerId', '==', 'cus_123');
      expect(mockUpdate).toHaveBeenCalledWith({
        subscriptionStatus: 'canceled',
        plan: 'basic',
        updatedAt: 'mock-timestamp'
      });
    });

    it('should handle customer.subscription.updated to active', async () => {
      const mockEvent = {
        id: 'evt_updated',
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_123',
            status: 'active'
          }
        }
      };

      mockConstructEvent.mockReturnValue(mockEvent as any);

      await handleStripeWebhook(payload, sig, endpointSecret);

      expect(mockUpdate).toHaveBeenCalledWith({
        subscriptionStatus: 'active',
        plan: 'premium',
        updatedAt: 'mock-timestamp'
      });
    });

    it('should handle customer.subscription.updated to past_due (revoke premium)', async () => {
      const mockEvent = {
        id: 'evt_updated_past_due',
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_123',
            status: 'past_due'
          }
        }
      };

      mockConstructEvent.mockReturnValue(mockEvent as any);

      await handleStripeWebhook(payload, sig, endpointSecret);

      expect(mockUpdate).toHaveBeenCalledWith({
        subscriptionStatus: 'past_due',
        plan: 'basic',
        updatedAt: 'mock-timestamp'
      });
    });

    it('should handle invoice.payment_failed', async () => {
      const mockEvent = {
        id: 'evt_payment_failed',
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_123'
          }
        }
      };

      mockConstructEvent.mockReturnValue(mockEvent as any);

      await handleStripeWebhook(payload, sig, endpointSecret);

      expect(mockUpdate).toHaveBeenCalledWith({
        subscriptionStatus: 'past_due',
        updatedAt: 'mock-timestamp'
      });
    });

    it('should safely ignore unknown event types', async () => {
      const mockEvent = {
        id: 'evt_unknown',
        type: 'unknown.event',
        data: { object: {} }
      };

      mockConstructEvent.mockReturnValue(mockEvent as any);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await handleStripeWebhook(payload, sig, endpointSecret);

      expect(result).toEqual({ received: true });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unhandled event type: unknown.event'));
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
