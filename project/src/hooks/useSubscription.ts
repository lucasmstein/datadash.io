import { useEffect, useState } from 'react';
import { checkSubscriptionStatus } from '../lib/stripe';

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const data = await checkSubscriptionStatus();
        setSubscription(data);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, []);

  return { subscription, loading };
}