import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const { error } = await supabase
      .from("subscriptions")
      .insert([
        {
          user_id: session.metadata?.user_id,
          status: "active",
          created_at: new Date().toISOString(),
          plan_id: session.metadata?.price_id,
          stripe_customer_id: session.customer,
          subscription_id: session.subscription,
        },
      ]);

    if (error) {
      console.error("Erro ao salvar subscription:", error);
      return new Response("Erro ao salvar no Supabase", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
});