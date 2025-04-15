
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (!user || error) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .single();

  if (!subscription) {
    return new Response(JSON.stringify({ error: "Subscription not found" }), {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  }

  try {
    const sub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    if (sub.status === "canceled") {
      return new Response(JSON.stringify({ success: true, message: "Already canceled" }), {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      });
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  }
});
