import { supabase } from './supabase';

const SUPABASE_FUNCTIONS_URL = 'https://cyevofqqtjbbwmnathfs.supabase.co/functions/v1';

export async function createCheckoutSession(priceId: string) {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error('User not authenticated');
  }

  const accessToken = data.session.access_token;
  const userId = data.session.user.id;

  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      price_id: priceId,
      user_id: userId,
      success_url: `${window.location.origin}/plans?success=true`,
      cancel_url: `${window.location.origin}/plans?canceled=true`,
    }),
  });

  const response = await res.json();

  console.log('[🔁 Stripe Response]', response);

  if (!response?.url) {
    console.error('[❌ Stripe Error]', response?.error || 'Unknown error');
    throw new Error('Checkout session failed');
  }

  window.location.href = response.url;
}


/**
 * Redireciona o usuário para o portal de gerenciamento de assinatura.
 */
export async function createPortalSession() {
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;

  if (!accessToken) throw new Error('User not authenticated');

  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const { url, error } = await res.json();

  if (!url) {
    console.error('[❌ Portal Error]', error);
    throw new Error('Failed to create portal session');
  }

  window.location.href = url;
}
