type SubscriptionPlan = {
    limits?: {
      dashboards: number;
      fileSizeMb: number;
      aiRequests: number;
    };
  };
  
  type Subscription = {
    subscription_plans?: SubscriptionPlan;
  };
  
  export function canUseLimit(
    subscription: Subscription | null,
    feature: 'dashboards' | 'fileSizeMb' | 'aiRequests',
    currentValue: number
  ): boolean {
    const limit = subscription?.subscription_plans?.limits?.[feature];
  
    if (limit === undefined || limit === null) return false;
    if (limit === 999999) return true;
  
    return currentValue < limit;
  }