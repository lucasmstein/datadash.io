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
    console.error("[❌ Webhook Signature Error]", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const userId = session.metadata?.user_id;
    const priceId = session.metadata?.price_id;

    if (!userId || !priceId) {
      console.error("[❌ Webhook] Metadata missing user_id or price_id", session.metadata);
      return new Response("Missing metadata", { status: 400 });
    }

    // Buscar o plano correto com base no price_id
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("stripe_price_id", priceId)
      .single();

    if (planError || !plan?.id) {
      console.error("[❌ Webhook] Plano não encontrado para price_id:", priceId);
      return new Response("Plano inválido", { status: 500 });
    }

    // Criar ou atualizar a assinatura
    const { data: upsertedSubscription, error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(
        [
          {
            user_id: userId,
            status: "active",
            created_at: new Date().toISOString(),
            plan_id: plan.id,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          },
        ],
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (upsertError) {
      console.error("[❌ Webhook] Erro ao salvar subscription:", upsertError);
      return new Response("Erro ao salvar assinatura", { status: 500 });
    }

    // Vincular no perfil do usuário
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ subscription_id: upsertedSubscription.id })
      .eq("id", userId);

    if (profileError) {
      console.error("[❌ Webhook] Erro ao atualizar perfil:", profileError);
      return new Response("Erro ao atualizar perfil", { status: 500 });
    }

    console.log("[✅ Webhook] Assinatura registrada com sucesso.");
  }

  return new Response("ok", { status: 200 });
});
