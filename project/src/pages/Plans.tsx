// Plans.tsx finalizado — 100% via Stripe Portal com aviso de cancelamento
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check, Loader2, AlertCircle, CheckCircle2, Info, CreditCard
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { createPortalSession } from '../lib/stripe';
import { supabase } from '../lib/supabase';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  stripe_price_id: string;
  stripe_annual_price_id?: string;
  limits: {
    dashboards: number;
    fileSizeMb: number;
    aiRequests: number;
  };
  popular?: boolean;
}

interface Usage {
  dashboards: number;
  fileSizeMb: number;
  aiRequests: number;
}

export function Plans() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage>({ dashboards: 0, fileSizeMb: 0, aiRequests: 0 });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success')) navigate('/plans');
    else if (params.get('canceled')) setError('Subscription canceled.');
  }, [location, navigate]);

  useEffect(() => {
    async function fetchPlans() {
      const { data } = await supabase.from('subscription_plans').select('*').order('price_monthly');
      if (data) setPlans(data);
    }
    async function fetchUsage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('dashboards').select('file_info').eq('user_id', user.id);
      const dashboards = data?.length || 0;
      const fileSizeMb = (data?.reduce((t, d) => t + (d.file_info?.size || 0), 0) || 0) / 1024 / 1024;
      setUsage({ dashboards, fileSizeMb: parseFloat(fileSizeMb.toFixed(2)), aiRequests: 0 });
    }
    fetchPlans();
    fetchUsage();
  }, []);

  const handlePortalRedirect = async () => {
    try {
      setProcessing(true);
      await createPortalSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const limits = subscription?.subscription_plans?.limits;
  const cancelAt = subscription?.cancel_at_period_end && subscription?.next_billing_date
    ? new Date(subscription.next_billing_date).toLocaleDateString()
    : null;

  const dashboardPercentage = limits?.dashboards
    ? Math.min(100, (usage.dashboards / limits.dashboards) * 100)
    : 0;
  const fileSizePercentage = limits?.fileSizeMb
    ? Math.min(100, (usage.fileSizeMb / limits.fileSizeMb) * 100)
    : 0;
  const aiRequestsPercentage = limits?.aiRequests
    ? Math.min(100, (usage.aiRequests / limits.aiRequests) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      {error && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 bg-red-500/10 text-red-500 px-5 py-4 rounded-xl border border-red-500/20">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {subscription && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Current Plan: <span className="text-blue-400">{subscription?.subscription_plans?.name}</span>
                </h2>

                {cancelAt && (
                  <p className="text-sm text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Your plan will be canceled on <strong>{cancelAt}</strong>
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-300">Dashboards: {usage.dashboards} / {limits?.dashboards ?? '-'}</p>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-2 bg-blue-500" style={{ width: `${dashboardPercentage}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Storage: {usage.fileSizeMb}MB / {limits?.fileSizeMb ?? '-'}MB</p>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-2 bg-purple-500" style={{ width: `${fileSizePercentage}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">AI Requests: {usage.aiRequests} / {limits?.aiRequests ?? '-'}</p>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-2 bg-green-500" style={{ width: `${aiRequestsPercentage}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePortalRedirect}
                  className="btn btn-secondary px-6 py-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-2 justify-center"
                  disabled={processing}
                >
                  <CreditCard className="w-4 h-4" /> Manage via Stripe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
   
{plans.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
    {plans.map((plan) => {
      const currentName = subscription?.subscription_plans?.name;
      const isActive = currentName === plan.name;
      const price = plan.price_monthly;

      const getActionLabel = () => {
        if (isActive) return 'Current Plan';
        if (currentName === 'Free') return `Upgrade to ${plan.name}`;
        if (plan.name === 'Free') return 'Downgrade to Free';
        return plan.price_monthly > subscription?.subscription_plans?.price_monthly
          ? `Upgrade to ${plan.name}`
          : `Downgrade to ${plan.name}`;
      };

      const handleClick = async () => {
        try {
          setProcessing(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          if (currentName === 'Free') {
            const priceId = plan.stripe_price_id;
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
              body: JSON.stringify({ priceId }),
            });
            const { url } = await res.json();
            window.location.href = url;
          } else {
            await createPortalSession();
          }
        } catch (err) {
          console.error(err);
          alert('Something went wrong');
        } finally {
          setProcessing(false);
        }
      };

      return (
        <div
          key={plan.id}
          className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] ${
            isActive
              ? 'bg-blue-600/20 border-2 border-blue-500'
              : plan.popular
              ? 'bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-purple-500 shadow-lg shadow-purple-500/10'
              : 'bg-gray-900/60 backdrop-blur-sm border border-gray-800'
          }`}
        >
          <div className="p-8 h-full flex flex-col">
            <div className="mb-6">
              <h3 className={`text-2xl font-bold ${plan.popular ? 'text-white' : ''}`}>{plan.name}</h3>
              <p className="mt-2 text-gray-400 text-sm">{plan.description}</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : ''}`}>${price}</span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
            </div>
            <div className="space-y-5 py-6 border-t border-b border-gray-700 mb-8">
              <div className="text-sm font-medium text-gray-300">Included Features</div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Dashboards: {plan.limits.dashboards === 999999 ? 'Unlimited' : plan.limits.dashboards}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">Storage: {plan.limits.fileSizeMb}MB</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm">AI Requests: {plan.limits.aiRequests === 999999 ? 'Unlimited' : `${plan.limits.aiRequests}/month`}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClick}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/20'
              }`}
              disabled={processing || isActive}
            >
              {getActionLabel()}
            </button>
          </div>
        </div>
      );
    })}
  </div>
)}

      <div className="pt-12 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-center mb-12">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Frequently Asked Questions
          </span>
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {['Can I cancel at any time?', 'How does the free plan work?', 'Can I switch plans later?'].map((q, i) => (
            <div key={i} className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-3 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-1" /> {q}
              </h3>
              <p className="text-gray-400">
                {i === 0 && "Yes, you can cancel your subscription at any time. You'll retain access until the end of the billing cycle."}
                {i === 1 && "You can start on the Free plan and upgrade when you're ready. You won't be charged unless you opt for a paid plan."}
                {i === 2 && "Yes, you can upgrade or downgrade your plan at any time through the customer portal."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}