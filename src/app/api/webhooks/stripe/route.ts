import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { accreditationDb } from '@/lib/firebase-admin';
import { getSecret } from '@/lib/config-helper';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  
  const webhookSecret = await getSecret('STRIPE_WEBHOOK_SECRET');
  const stripe = await getStripe();

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
  } catch (err: any) {
    console.error(`[Stripe] Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle various events
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription;
        
        if (userId) {
          // Identify tier from product metadata or recurring interval
          // For now we default to 'enterprise' if a session completes
          await accreditationDb.collection('users').doc(userId).set({
            tier: 'enterprise',
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date(),
          }, { merge: true });
          
          console.log(`[Stripe] User ${userId} upgraded to enterprise via webhooks.`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const snap = await accreditationDb.collection('users')
          .where('stripeSubscriptionId', '==', subscription.id)
          .get();
          
        if (!snap.empty) {
          const userId = snap.docs[0].id;
          await accreditationDb.collection('users').doc(userId).update({
            tier: 'free',
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          });
          console.log(`[Stripe] User ${userId} subscription cancelled.`);
        }
        break;
      }
    }
  } catch (err: any) {
    console.error('[Stripe] Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
