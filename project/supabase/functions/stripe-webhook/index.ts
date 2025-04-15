
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
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const body = await req.text();
  const rawBody = new TextEncoder().encode(body);

  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature!, webhookSecret);
  } catch (err) {
    console.error("❌ Erro na assinatura do Stripe:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const userId = session.metadata?.user_id;
    const priceId = session.metadata?.price_id;
    const subscriptionId = session.subscription;
    const customerId = session.customer;

    if (!userId || !priceId) return new Response("Metadados ausentes", { status: 400 });

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("stripe_price_id", priceId)
      .single();

    if (!plan) return new Response("Plano não encontrado", { status: 500 });

    await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan_id: plan.id,
      status: "active",
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("stripe_subscription_id", subscriptionId)
      .single();

    if (subscription) {
      await supabase
        .from("profiles")
        .update({ subscription_id: subscription.id })
        .eq("id", userId);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as any;
    const subscriptionId = subscription.id;
    const customerId = subscription.customer;
    const status = subscription.status;
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    const currentPeriodEnd = subscription.current_period_end;

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, user_id")
      .eq("stripe_subscription_id", subscriptionId)
      .single();

    const userId = existing?.user_id;

    if (!userId || !priceId) return new Response("Dados ausentes", { status: 400 });

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("stripe_price_id", priceId)
      .single();

    if (!plan) return new Response("Plano não encontrado", { status: 500 });

    await supabase
      .from("subscriptions")
      .update({
        plan_id: plan.id,
        status,
        cancel_at_period_end: cancelAtPeriodEnd,
        next_billing_date: new Date(currentPeriodEnd * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);

    const profileUpdate = status === "active"
      ? { subscription_id: existing.id }
      : { subscription_id: null };

    await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);

    return new Response("Assinatura atualizada", { status: 200 });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;
    console.log("🛑 Assinatura excluída no Stripe:", subscription.id);
    return new Response("Assinatura deletada", { status: 200 });
  }

  return new Response("Evento ignorado", { status: 200 });
});
