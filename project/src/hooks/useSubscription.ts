// hooks/useSubscription.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'canceled';
  trial_end: string;
  current_period_end: string;
  subscription_plans: SubscriptionPlan;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true);
      const {
        data,
        error,
      } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle<Subscription>();

      if (!error) {
        setSubscription(data);
      }

      setLoading(false);
    };

    fetchSubscription();
  }, []);

  return { subscription, loading };
}
export type { Subscription };

