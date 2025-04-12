import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { createCheckoutSession, createPortalSession } from '../lib/stripe';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  stripePriceId: string;
  features: PlanFeature[];
  limits: {
    dashboards: number;
    fileSizeMb: number;
    aiRequests: number;
  };
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    stripePriceId: 'price_free',
    features: [
      { name: 'Up to 3 dashboards', included: true },
      { name: 'Basic data visualization', included: true },
      { name: 'CSV file upload', included: true },
      { name: 'Email support', included: true },
      { name: 'Advanced visualizations', included: false },
      { name: 'Custom branding', included: false },
      { name: 'Team collaboration', included: false },
      { name: 'Advanced AI features', included: false },
    ],
    limits: {
      dashboards: 3,
      fileSizeMb: 5,
      aiRequests: 10,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For growing businesses',
    price: 29,
    stripePriceId: 'price_starter',
    features: [
      { name: 'Unlimited dashboards', included: true },
      { name: 'Advanced visualizations', included: true },
      { name: 'Priority support', included: true },
      { name: 'Export to PDF', included: true },
      { name: 'Custom branding', included: false },
      { name: 'Team collaboration', included: false },
      { name: 'Advanced AI features', included: false },
    ],
    limits: {
      dashboards: 999999,
      fileSizeMb: 25,
      aiRequests: 100,
    },
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users',
    price: 99,
    stripePriceId: 'price_pro',
    features: [
      { name: 'Everything in Starter', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Team collaboration', included: true },
      { name: 'Advanced AI features', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'API access', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
    limits: {
      dashboards: 999999,
      fileSizeMb: 100,
      aiRequests: 999999,
    },
  },
];

export function Plans() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscription, loading: loadingSubscription } = useSubscription();
  const [selectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle success/error messages from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success')) {
      navigate('/plans', { replace: true });
    } else if (params.get('canceled')) {
      setError('Subscription process was canceled.');
      navigate('/plans', { replace: true });
    }
  }, [location, navigate]);

  const handleSubscribe = async (plan: Plan) => {
    try {
      setProcessing(true);
      setError(null);
      await createCheckoutSession(plan.stripePriceId);
    } catch (err: any) {
      setError(err.message || 'Failed to start subscription process');
      setProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setProcessing(true);
      setError(null);
      await createPortalSession();
    } catch (err: any) {
      setError(err.message || 'Failed to open subscription management');
      setProcessing(false);
    }
  };

  if (loadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="mt-2 text-gray-400">
          Start with a 7-day free trial. No credit card required.
        </p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-3 rounded-xl">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      {subscription && (
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Current Plan: {subscription.subscription_plans.name}
                </h2>
                <p className="text-gray-400 mt-1">
                  {subscription.status === 'trialing'
                    ? 'Trial ends on ' + new Date(subscription.trial_end).toLocaleDateString()
                    : subscription.status === 'active'
                    ? 'Next billing date: ' + new Date(subscription.current_period_end).toLocaleDateString()
                    : 'Subscription ' + subscription.status}
                </p>
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={processing}
                className="btn btn-secondary"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Manage Subscription'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card relative ${
              plan.popular
                ? 'border-2 border-blue-500 shadow-blue-500/20'
                : 'border border-gray-700'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-gray-400">{plan.description}</p>
              </div>

              <div className="flex items-baseline">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>

              <div className="space-y-3 py-4 border-y border-gray-700">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">Plan Limits</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Dashboards</span>
                      <span className="font-medium">
                        {plan.limits.dashboards === 999999 ? 'Unlimited' : plan.limits.dashboards}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>File Size</span>
                      <span className="font-medium">{plan.limits.fileSizeMb}MB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>AI Requests</span>
                      <span className="font-medium">
                        {plan.limits.aiRequests === 999999
                          ? 'Unlimited'
                          : plan.limits.aiRequests + '/mo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">Features</div>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-center text-sm">
                        {feature.included ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-500 mr-2" />
                        ) : (
                          <div className="w-4 h-4 border border-gray-600 rounded-full mr-2" />
                        )}
                        <span className={!feature.included ? 'text-gray-500' : ''}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={
                  processing ||
                  (subscription?.subscription_plans.name === plan.name &&
                    subscription?.status === 'active')
                }
                className={`w-full btn ${
                  plan.popular ? 'btn-primary' : 'btn-secondary'
                } flex items-center justify-center`}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : subscription?.subscription_plans.name === plan.name &&
                  subscription?.status === 'active' ? (
                  'Current Plan'
                ) : (
                  'Choose Plan'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card text-left">
            <h3 className="font-medium mb-2">What happens after my trial?</h3>
            <p className="text-gray-400 text-sm">
              After your 7-day trial, you'll be charged for your selected plan. You can cancel
              anytime before the trial ends.
            </p>
          </div>
          <div className="card text-left">
            <h3 className="font-medium mb-2">Can I change plans later?</h3>
            <p className="text-gray-400 text-sm">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect
              immediately.
            </p>
          </div>
          <div className="card text-left">
            <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-400 text-sm">
              We accept all major credit cards and debit cards through our secure payment
              processor, Stripe.
            </p>
          </div>
          <div className="card text-left">
            <h3 className="font-medium mb-2">Is there a long-term contract?</h3>
            <p className="text-gray-400 text-sm">
              No contracts! All plans are month-to-month and you can cancel at any time
              without penalty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}