import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';

interface Props {
  children: React.ReactNode;
  requiredPlan?: 'starter' | 'pro';
}

export function SubscriptionGuard({ children, requiredPlan }: Props) {
  const { subscription, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!subscription || (requiredPlan && subscription.subscription_plans.name.toLowerCase() !== requiredPlan)) {
    return <Navigate to="/plans?upgrade=true" replace />;
  }

  return <>{children}</>;
}