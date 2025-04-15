import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("❌ Erro ao verificar assinatura Stripe:", err.message || err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const userId = session.metadata?.user_id;
    const priceId = session.metadata?.price_id;

    if (!userId || !priceId) {
      console.error("❌ Metadados ausentes");
      return new Response("Metadados ausentes", { status: 400 });
    }

    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("stripe_price_id", priceId)
      .single();

    if (planError || !plan) {
      console.error("❌ Plano não encontrado:", planError);
      return new Response("Plano não encontrado", { status: 500 });
    }

    const { error: subError } = await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan_id: plan.id,
      status: "active",
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    });

    if (subError) {
      console.error("❌ Erro ao salvar assinatura:", subError);
      return new Response("Erro ao salvar assinatura", { status: 500 });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("stripe_subscription_id", subscriptionId)
      .single();

    if (subscription) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ subscription_id: subscription.id })
        .eq("id", userId);

      if (profileError) {
        console.error("❌ Erro ao atualizar profile:", profileError);
        return new Response("Erro ao atualizar profile", { status: 500 });
      }
    }

    console.log("✅ Webhook processado com sucesso");
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  return new Response("Evento ignorado", { status: 200 });
});
