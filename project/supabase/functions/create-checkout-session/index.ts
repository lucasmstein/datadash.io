import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 🔐 Pega a chave do Stripe vinda da tabela `settings`
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

    // 🔐 Autenticação do usuário via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing authorization header', { status: 401 });
    }

    const jwt = authHeader.replace('Bearer ', '');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response('Not authenticated', { status: 401 });
    }

    // 🧾 Criação da sessão de checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email!,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${Deno.env.get('SITE_URL')}/plans?success=true`,
      cancel_url: `${Deno.env.get('SITE_URL')}/plans?canceled=true`,
      metadata: {
        user_id: user.id,
        price_id: priceId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
