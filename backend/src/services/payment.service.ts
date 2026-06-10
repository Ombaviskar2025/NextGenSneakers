import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const isStripeConfigured =
  process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder');
const isRazorpayConfigured =
  process.env.RAZORPAY_KEY_ID &&
  !process.env.RAZORPAY_KEY_ID.includes('placeholder') &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_SECRET.includes('placeholder');

// Initialize Stripe (if configured)
const stripe = isStripeConfigured
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any })
  : null;

// Initialize Razorpay (if configured)
const razorpay = isRazorpayConfigured
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  : null;

export const paymentService = {
  /**
   * Stripe: Create Payment Intent
   */
  async createStripePaymentIntent(amount: number, currency: string = 'usd', orderId: string) {
    if (isStripeConfigured && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: { orderId },
        });
        return {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          gateway: 'stripe',
          amount,
        };
      } catch (error: any) {
        console.error('Stripe Payment Intent error:', error.message);
        throw error;
      }
    }

    // Fallback Mock Stripe Client Secret
    console.log(`[MOCK PAYMENT SERVICE] Generating mock Stripe intent for Order ${orderId}`);
    return {
      id: `pi_mock_${Math.random().toString(36).substring(7)}`,
      clientSecret: `pi_mock_secret_${Math.random().toString(36).substring(7)}`,
      gateway: 'stripe',
      amount,
    };
  },

  /**
   * Razorpay: Create Order
   */
  async createRazorpayOrder(amount: number, currency: string = 'INR', receipt: string) {
    if (isRazorpayConfigured && razorpay) {
      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100), // Convert to paise
          currency,
          receipt,
        });
        return {
          id: order.id,
          gateway: 'razorpay',
          amount,
          currency,
        };
      } catch (error: any) {
        console.error('Razorpay Order creation error:', error.message);
        throw error;
      }
    }

    // Fallback Mock Razorpay Order
    console.log(`[MOCK PAYMENT SERVICE] Generating mock Razorpay order for receipt ${receipt}`);
    return {
      id: `order_mock_${Math.random().toString(36).substring(7)}`,
      gateway: 'razorpay',
      amount,
      currency,
    };
  },

  /**
   * Razorpay: Verify Payment Signature
   */
  verifyRazorpayPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    if (isRazorpayConfigured) {
      try {
        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const generatedSignature = crypto
          .createHmac('sha256', secret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');

        return generatedSignature === razorpaySignature;
      } catch (error) {
        console.error('Razorpay signature verification failed:', error);
        return false;
      }
    }

    // Fallback verify always true for mock IDs
    return razorpayOrderId.startsWith('order_mock_') || razorpayOrderId.startsWith('pay_');
  },

  /**
   * Stripe Webhook Verification helper
   */
  verifyStripeWebhook(rawBody: string | Buffer, signature: string, webhookSecret: string) {
    if (isStripeConfigured && stripe) {
      return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
    throw new Error('Stripe is not configured for webhook construction');
  },
};
