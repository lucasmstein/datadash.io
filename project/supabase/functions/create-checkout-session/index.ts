import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import Stripe from "npm:stripe@14.12.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId } = await req.json();
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];

    if (!token) {
      return new Response(JSON.stringify({ error: "No authorization token" }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    // Verifica se já tem stripe_customer_id
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabase_user_id: user.id },
      });

      customerId = customer.id;

      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: 'incomplete',
      }, { onConflict: 'user_id' });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/plans?success=true`,
      cancel_url: `${req.headers.get("origin")}/plans?canceled=true`,
      subscription_data: {
        trial_period_days: 7,
      },
      metadata: {
        user_id: user.id,
        price_id: priceId,
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (err) {
    console.error("❌ Checkout session error:", err);
    return new Response(JSON.stringify({
      error: "Failed to create checkout session",
      details: err instanceof Error ? err.message : "Unknown error",
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
