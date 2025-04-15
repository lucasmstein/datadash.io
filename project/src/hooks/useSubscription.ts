
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Failed to fetch subscription:', error.message);
      } else {
        setSubscription(data);
      }

      setLoading(false);
    }

    fetchSubscription();
  }, []);

  return { subscription, loading };
}
