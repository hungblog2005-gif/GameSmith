/**
 * Example: Stripe Integration for Payment Module
 * 
 * Installation:
 * npm install stripe
 * 
 * Environment Variables:
 * STRIPE_SECRET_KEY=sk_test_xxxxx
 * STRIPE_PUBLIC_KEY=pk_test_xxxxx
 * STRIPE_WEBHOOK_SECRET=whsec_xxxxx
 * 
 * NOTE: This file contains example code. 
 * Uncomment the imports below when you install stripe package.
 */

import { Injectable, BadRequestException } from '@nestjs/common';
// import Stripe from 'stripe';
// NOTE: Uncomment above line after: npm install stripe

@Injectable()
export class StripeService {
  private stripe: any; // Type: Stripe when installed

  constructor() {
    // Uncomment when stripe is installed:
    // this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    //   apiVersion: '2023-10-16',
    // });
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not configured. Install stripe and uncomment initialization.');
    }
  }

  /**
   * Create Payment Intent
   * Called from frontend after creating payment record
   */
  async createPaymentIntent(
    paymentId: string,
    amount: number,
    email: string,
  ) {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          paymentId: paymentId, // Link back to our payment record
        },
        receipt_email: email,
        description: `Payment for Asset Purchase - Order ${paymentId}`,
      });

      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to create payment intent: ${error.message}`,
      );
    }
  }

  /**
   * Verify Webhook Signature from Stripe
   * Important: Verify webhook signature to ensure request is from Stripe
   */
  verifyWebhookSignature(
    body: Buffer,
    signature: string,
  ): any { // Type: Stripe.Event when stripe is installed
    try {
      // Uncomment when stripe is installed:
      // const event = this.stripe.webhooks.constructEvent(
      //   body,
      //   signature,
      //   process.env.STRIPE_WEBHOOK_SECRET!,
      // );
      // return event;
      
      throw new Error('Stripe not installed. Run: npm install stripe');
    } catch (error: any) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${error.message}`,
      );
    }
  }

  /**
   * Confirm Payment (Optional - for more control)
   * Usually confirmed by frontend using stripe.js
   */
  async confirmPaymentIntent(paymentIntentId: string) {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
      );
      return intent;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to retrieve payment intent: ${error.message}`,
      );
    }
  }

  /**
   * Refund Payment
   * Can be called if order is cancelled or user requests refund
   */
  async refundPayment(chargeId: string, amount?: number) {
    try {
      const refund = await this.stripe.refunds.create({
        charge: chargeId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });
      return refund;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to refund payment: ${error.message}`,
      );
    }
  }

  /**
   * Get Payment Intent Details
   */
  async getPaymentIntent(paymentIntentId: string) {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
      );
      return intent;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to get payment intent: ${error.message}`,
      );
    }
  }
}

/**
 * Example: Stripe Webhook Controller
 * 
 * This should be a separate controller in your app, but shown here for reference
 */
export const stripeWebhookExample = `
import { Controller, Post, Req, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Stripe Webhook Endpoint
   * Configure in Stripe Dashboard:
   * Event types: charge.succeeded, charge.failed, charge.refunded
   * Endpoint URL: https://your-domain.com/stripe/webhook
   */
  @Post('webhook')
  async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody;

    try {
      // Verify signature
      const event = this.stripeService.verifyWebhookSignature(
        rawBody,
        signature,
      );

      // Handle different event types
      switch (event.type) {
        case 'charge.succeeded':
          await this.handleChargeSucceeded(event.data.object);
          break;

        case 'charge.failed':
          await this.handleChargeFailed(event.data.object);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;

        default:
          console.log('Unhandled event type:', event.type);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { received: false };
    }
  }

  private async handleChargeSucceeded(charge: any) {
    const paymentId = charge.metadata?.paymentId;
    if (!paymentId) {
      console.warn('Charge succeeded but no paymentId in metadata');
      return;
    }

    await this.paymentsService.handlePaymentCallback({
      paymentId,
      transaction_id: charge.id,
      status: 'success',
      gateway_response: charge,
      signature: 'pre_verified', // Already verified by stripe
    });
  }

  private async handleChargeFailed(charge: any) {
    const paymentId = charge.metadata?.paymentId;
    if (!paymentId) return;

    await this.paymentsService.handlePaymentCallback({
      paymentId,
      transaction_id: charge.id,
      status: 'failed',
      error_message: charge.failure_message,
      gateway_response: charge,
      signature: 'pre_verified',
    });
  }

  private async handleChargeRefunded(charge: any) {
    const paymentId = charge.metadata?.paymentId;
    if (!paymentId) return;

    // Handle refund - you might want to update order status
    console.log('Payment refunded:', paymentId);
  }
}
`;

/**
 * Example: Frontend Integration with Stripe
 * 
 * Installation:
 * npm install @stripe/react-stripe-js @stripe/js
 */
export const frontendIntegrationExample = `
import { useState } from 'react';
import { loadStripe } from '@stripe/js';
import { CardElement, useElements, useStripe, Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function PaymentForm({ paymentId, amount, email }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // 1. Get clientSecret from your backend
      const { clientSecret } = await fetch('/stripe/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, amount, email }),
      }).then(r => r.json());

      // 2. Confirm payment with card element
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { email },
        },
      });

      if (error) {
        setError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment successful!
        window.location.href = '/orders'; // Redirect to orders
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || isProcessing}>
        {isProcessing ? 'Processing...' : 'Pay $' + amount}
      </button>
      {error && <div>{error}</div>}
    </form>
  );
}

// Usage
export function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        paymentId="payment_123"
        amount={29.99}
        email="user@example.com"
      />
    </Elements>
  );
}
`;

/**
 * Example: Backend API Endpoints for Stripe Integration
 */
export const apiEndpointExample = `
// POST /stripe/create-intent
async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
  const { clientSecret, paymentIntentId } = 
    await this.stripeService.createPaymentIntent(
      dto.paymentId,
      dto.amount,
      dto.email
    );

  // Return clientSecret to frontend
  return { clientSecret, paymentIntentId };
}

// POST /stripe/webhook
async handleWebhook(@Req() req: RawBodyRequest<Request>) {
  const signature = req.headers['stripe-signature'];
  
  try {
    const event = this.stripeService.verifyWebhookSignature(
      req.rawBody,
      signature
    );
    
    // Process event
    // ...
    
    return { received: true };
  } catch (error) {
    return { received: false };
  }
}
`;
