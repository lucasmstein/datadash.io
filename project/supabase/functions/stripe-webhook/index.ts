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
  console.log("🧪 Webhook session received:", JSON.stringify(session, null, 2));

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    // 🔍 Buscar plano pelo price_id
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("stripe_price_id", session.metadata?.price_id)
      .single();

    if (planError || !plan?.id) {
      console.error("Plano não encontrado:", session.metadata?.price_id);
      return new Response("Plano inválido", { status: 500 });
    }

    // ✅ Atualiza assinatura
    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert([
        {
          user_id: session.metadata?.user_id,
          status: "active",
          created_at: new Date().toISOString(),
          plan_id: plan.id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        },
      ], { onConflict: 'user_id' });

    if (upsertError) {
      console.error("Erro ao salvar subscription:", upsertError);
      return new Response("Erro ao salvar assinatura", { status: 500 });
    }

    // ✅ Atualiza perfil
    await supabase
      .from("profiles")
      .update({ subscription_id: session.id })
      .eq("id", session.metadata?.user_id);
  }

  return new Response("ok", { status: 200 });
});
