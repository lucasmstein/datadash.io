// Supabase Edge Function: stripe-webhook.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2022-11-15' });

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    console.error('[Webhook signature error]', err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    const session = event.data.object as any;

    switch (event.type) {
      case 'checkout.session.completed': {
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;

        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .single();

        if (!plan) throw new Error('Plan not found');

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', session.customer_email)
          .single();

        if (!profile) throw new Error('Profile not found');

        const { data: inserted } = await supabase
          .from('subscriptions')
          .upsert([
            {
              user_id: profile.id,
              plan_id: plan.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end,
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            },
          ], { onConflict: 'user_id' })
          .select()
          .single();

        await supabase
          .from('profiles')
          .update({ subscription_id: inserted.id })
          .eq('id', profile.id);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (sub) {
          await supabase
            .from('subscriptions')
            .delete()
            .eq('id', sub.id);

          await supabase
            .from('profiles')
            .update({ subscription_id: null })
            .eq('id', sub.user_id);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (err) {
    console.error('[Webhook processing error]', err);
    return new Response(`Webhook Handler Error: ${err.message}`, { status: 500 });
  }
});