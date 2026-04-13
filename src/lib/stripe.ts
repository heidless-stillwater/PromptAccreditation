import Stripe from 'stripe';
import { getSecret } from './config-helper';

let stripeInstance: Stripe | null = null;

/**
 * Singleton instance of Stripe.
 * Fetches the secret key from the global secret store.
 */
export async function getStripe() {
    if (!stripeInstance) {
        const apiKey = await getSecret('STRIPE_SECRET_KEY');
        if (!apiKey) {
            throw new Error('STRIPE_SECRET_KEY is missing from global constellation config');
        }
        
        stripeInstance = new Stripe(apiKey, {
            apiVersion: '2024-06-20', // Using latest stable supported version
            typescript: true,
        });
    }
    return stripeInstance;
}
