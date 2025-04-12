import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
export const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Helper to check subscription status
export async function checkSubscriptionStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          features,
          limits
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return subscription;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return null;
  }
}

// Helper to create checkout session
export async function createCheckoutSession(priceId: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({ priceId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Checkout session creation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (!data.sessionId) {
      throw new Error('Invalid response from checkout session creation');
    }

    return stripe?.redirectToCheckout({ sessionId: data.sessionId });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Helper to create portal session
export async function createPortalSession() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Portal session creation failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error('Invalid response from portal session creation');
    }

    window.location.href = data.url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}