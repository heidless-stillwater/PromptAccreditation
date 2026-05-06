export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { accreditationDb, toolDb, masterDb } from '@/lib/firebase-admin';
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
          // Update Global Identity Store
          const userRef = accreditationDb.collection('users').doc(userId);
          const userDoc = await userRef.get();
          
          let activeSuites = [];
          if (userDoc.exists) {
            activeSuites = userDoc.data()?.suiteSubscription?.activeSuites || [];
          }
          
          const tier = session.metadata?.tier || 'professional';
          const suiteId = `accreditation-${tier}`;
          
          // Add tier-specific suite to activeSuites if not present
          if (!activeSuites.includes(suiteId)) {
            activeSuites.push(suiteId);
          }

          const { toolDb, masterDb } = await import('@/lib/firebase-admin');

          const updatePayload = {
            suiteSubscription: {
              activeSuites,
              stripeSubscriptionId: subscriptionId,
              status: 'active',
              updatedAt: new Date(),
            },
            // Legacy/Cross-App compatibility
            subscriptionMetadata: {
              activeSuites,
              status: 'active'
            },
            subscription: tier === 'enterprise' ? 'pro' : 'standard',
            updatedAt: new Date(),
          };

          await Promise.all([
            accreditationDb.collection('users').doc(userId).set(updatePayload, { merge: true }),
            toolDb.collection('users').doc(userId).set(updatePayload, { merge: true }),
            masterDb.collection('users').doc(userId).set(updatePayload, { merge: true })
          ]);
          
          console.log(`[Stripe] User ${userId} upgraded to enterprise in Global Registry.`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        
        // Find user in Global Registry by subscription ID
        const snap = await accreditationDb.collection('users')
          .where('suiteSubscription.stripeSubscriptionId', '==', subscription.id)
          .get();
          
        if (!snap.empty) {
          const userId = snap.docs[0].id;
          const userRef = accreditationDb.collection('users').doc(userId);
          const data = snap.docs[0].data();
          
          let activeSuites = data.suiteSubscription?.activeSuites || [];
          activeSuites = activeSuites.filter((s: string) => !s.startsWith('accreditation'));

          await userRef.set({
            suiteSubscription: {
              activeSuites,
              stripeSubscriptionId: null,
              status: 'cancelled',
              updatedAt: new Date(),
            }
          }, { merge: true });
          
          console.log(`[Stripe] User ${userId} downgraded in Global Registry.`);
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
