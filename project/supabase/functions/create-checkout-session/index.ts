import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.3';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: setting, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stripe_sk')
      .single();

    if (error || !setting?.value) {
      console.error('Stripe key not found', error);
      return new Response('Stripe secret key not found', { status: 500 });
    }

    const stripe = new Stripe(setting.value, {
      apiVersion: '2023-10-16',
    });

    const body = await req.json();
    const priceId = body.priceId;

    const authHeader = req.headers.get('Authorization')!;
    const jwt = authHeader.replace('Bearer ', '');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response('Not authenticated', { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email!,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${Deno.env.get('SITE_URL')}/success`,
      cancel_url: `${Deno.env.get('SITE_URL')}/cancel`,
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
