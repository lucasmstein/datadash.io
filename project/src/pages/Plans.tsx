import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertCircle, CheckCircle2, X, Info, CreditCard, Zap, Clock, Shield, Award } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { createCheckoutSession, createPortalSession } from '../lib/stripe';
import { supabase } from '../lib/supabase';

export function Plans() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscription, loading: loadingSubscription } = useSubscription();
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState({ dashboards: 0, fileSizeMb: 0, aiRequests: 0 });
  const [billingInterval, setBillingInterval] = useState('monthly');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success')) {
      window.location.href = '/plans';
    } else if (params.get('canceled')) {
      setError('Subscription process was canceled.');
      navigate('/plans', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (!error) setPlans(data || []);
    }

    async function fetchUsage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('dashboards')
        .select('file_info')
        .eq('user_id', user.id);

      const dashboards = data?.length || 0;
      const fileSizeMb =
        (data?.reduce((total, d) => total + (d.file_info?.size || 0), 0) || 0) / 1024 / 1024;
      const aiRequests = 0;

      setUsage({ dashboards, fileSizeMb: parseFloat(fileSizeMb.toFixed(2)), aiRequests });
    }

    fetchPlans();
    fetchUsage();
  }, []);

  const handleSubscribe = async (plan) => {
    try {
      setProcessing(true);
      setError(null);
      if (plan.name.toLowerCase() === 'free') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('stripe_price_id', plan.stripe_price_id)
          .single();

        await supabase
          .from('subscriptions')
          .upsert([{ user_id: user.id, plan_id: planData.id, status: 'active', created_at: new Date().toISOString() }], { onConflict: 'user_id' });

        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .single();

        await supabase
          .from('profiles')
          .update({ subscription_id: subRecord.id })
          .eq('id', user.id);

        window.location.href = '/plans';
        return;
      }

      const priceId = billingInterval === 'monthly' 
        ? plan.stripe_price_id 
        : plan.stripe_annual_price_id;
        
      await createCheckoutSession(priceId);
    } catch (err) {
      setError(err.message || 'Failed to start subscription process');
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setProcessing(true);
      setError(null);
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      setShowModal(false);
      window.location.href = '/plans';
    } catch (err) {
      setError(err.message || 'Cancel failed');
    } finally {
      setProcessing(false);
    }
  };

  const currentPlanName = subscription?.subscription_plans?.name ?? '';
  
  // Calculate usage percentages
  const dashboardPercentage = subscription?.subscription_plans?.limits?.dashboards 
    ? Math.min(100, (usage.dashboards / subscription.subscription_plans.limits.dashboards) * 100) 
    : 0;
    
  const fileSizePercentage = subscription?.subscription_plans?.limits?.fileSizeMb
    ? Math.min(100, (usage.fileSizeMb / subscription.subscription_plans.limits.fileSizeMb) * 100)
    : 0;
    
  const aiRequestsPercentage = subscription?.subscription_plans?.limits?.aiRequests
    ? Math.min(100, (usage.aiRequests / subscription.subscription_plans.limits.aiRequests) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Choose Your Perfect Plan
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Start with a 7-day free trial. No credit card required.
        </p>
      </div>

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
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Current Plan: <span className="text-blue-400">{subscription?.subscription_plans?.name ?? 'Unknown'}</span>
                  </h2>
                  {subscription?.status === 'active' && subscription?.cancel_at_period_end && (
                    <p className="text-yellow-400 mt-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Plan will be cancelled at the end of billing cycle
                    </p>
                  )}
                  {subscription?.next_billing_date && (
                    <p className="text-gray-400 mt-2">
                      Next billing date: {new Date(subscription.next_billing_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">Dashboards used</span>
                      <span className="text-sm font-medium">
                        {usage.dashboards} / {subscription?.subscription_plans?.limits?.dashboards === 999999 
                          ? '∞' 
                          : subscription?.subscription_plans?.limits?.dashboards ?? '-'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${dashboardPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">Storage used</span>
                      <span className="text-sm font-medium">
                        {usage.fileSizeMb}MB / {subscription?.subscription_plans?.limits?.fileSizeMb ?? '-'}MB
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${fileSizePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">AI Requests</span>
                      <span className="text-sm font-medium">
                        {usage.aiRequests} / {subscription?.subscription_plans?.limits?.aiRequests === 999999 
                          ? '∞' 
                          : subscription?.subscription_plans?.limits?.aiRequests ?? '-'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${aiRequestsPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => createPortalSession()} 
                  className="btn btn-secondary px-6 py-2 rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-2 justify-center" 
                  disabled={processing}
                >
                  <CreditCard className="w-4 h-4" />
                  Manage Plan
                </button>
                <button 
                  onClick={() => setShowModal(true)} 
                  className="btn btn-danger px-6 py-2 rounded-lg border border-red-700 bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors flex items-center gap-2 justify-center" 
                  disabled={processing}
                >
                  <X className="w-4 h-4" />
                  Cancel Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Billing interval toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-full p-1 inline-flex">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              billingInterval === 'yearly'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Annual <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isActive = currentPlanName === plan.name;
          const price = billingInterval === 'monthly' 
            ? plan.price_monthly 
            : (plan.price_monthly * 12 * 0.8).toFixed(0); // 20% discount for annual

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
              {plan.popular && (
                <div className="absolute -top-px left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              )}
              {plan.popular && (
                <div className="absolute top-6 right-6">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Popular
                  </span>
                </div>
              )}
              <div className="p-8 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className={`text-2xl font-bold ${plan.popular ? 'text-white' : ''}`}>{plan.name}</h3>
                  <p className="mt-2 text-gray-400 text-sm">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : ''}`}>
                      ${price}
                    </span>
                    <span className="text-gray-400 ml-2">/{billingInterval === 'monthly' ? 'mês' : 'ano'}</span>
                  </div>
                  {billingInterval === 'yearly' && plan.name.toLowerCase() !== 'free' && (
                    <p className="text-green-400 text-sm mt-2">Economize ${(plan.price_monthly * 12 * 0.2).toFixed(0)} por ano</p>
                  )}
                </div>
                
                <div className="space-y-5 py-6 border-t border-b border-gray-700 mb-8">
                  <div className="text-sm font-medium text-gray-300">Included Features</div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="flex justify-between w-full text-sm">
                        <span className="text-gray-300">Dashboards</span>
                        <span className="font-medium">
                          {plan.limits?.dashboards === 999999 ? 'Unlimited' : plan.limits?.dashboards}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="flex justify-between w-full text-sm">
                        <span className="text-gray-300">File Size</span>
                        <span className="font-medium">{plan.limits?.fileSizeMb ?? '-'}MB</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="flex justify-between w-full text-sm">
                        <span className="text-gray-300">AI Requests</span>
                        <span className="font-medium">
                          {plan.limits?.aiRequests === 999999 ? 'Unlimited' : plan.limits?.aiRequests + '/month'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={processing || isActive}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      processing
                        ? 'bg-gray-700 cursor-not-allowed'
                        : isActive
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/20'
                        : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : isActive ? (
                      'Current Plan'
                    ) : (
                      'Choose Plan'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Confirm Cancellation</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel your subscription? You'll keep access until the end of the current billing cycle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button 
                className="px-5 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors" 
                onClick={() => setShowModal(false)} 
                disabled={processing}
              >
                No, keep my plan
              </button>
              <button 
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2" 
                onClick={handleCancelSubscription} 
                disabled={processing}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Features comparison */}
      <div className="pt-12 border-t border-gray-800">
        <h2 className="text-2xl font-bold text-center mb-12">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Features Comparison
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="py-4 px-6 text-left">Feature</th>
                {plans.map(plan => (
                  <th key={`head-${plan.id}`} className={`py-4 px-6 text-center ${plan.popular ? 'text-blue-400' : ''}`}>
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 text-gray-300 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  Dashboards
                </td>
                {plans.map(plan => (
                  <td key={`dashboard-${plan.id}`} className="py-4 px-6 text-center">
                    {plan.limits?.dashboards === 999999 ? 'Unlimited' : plan.limits?.dashboards}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 text-gray-300 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-purple-400" />
                  </div>
                  File Upload Size
                </td>
                {plans.map(plan => (
                  <td key={`size-${plan.id}`} className="py-4 px-6 text-center">
                    {plan.limits?.fileSizeMb}MB
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 text-gray-300 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-green-400" />
                  </div>
                  AI Requests
                </td>
                {plans.map(plan => (
                  <td key={`ai-${plan.id}`} className="py-4 px-6 text-center">
                    {plan.limits?.aiRequests === 999999 ? 'Unlimited' : plan.limits?.aiRequests + '/month'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 text-gray-300 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Info className="w-4 h-4 text-blue-400" />
                  </div>
                  Email Support
                </td>
                {plans.map(plan => (
                  <td key={`support-${plan.id}`} className="py-4 px-6 text-center">
                    {plan.name.toLowerCase() !== 'free' ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 text-gray-300 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  Priority Support
                </td>
                {plans.map(plan => (
                  <td key={`priority-${plan.id}`} className="py-4 px-6 text-center">
                    {plan.name.toLowerCase() === 'premium' || plan.name.toLowerCase() === 'enterprise' ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-6 text-gray-300 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  Response Time
                </td>
                {plans.map((plan, index) => {
                  let response;
                  if (plan.name.toLowerCase() === 'free') {
                    response = '48 hours';
                  } else if (plan.name.toLowerCase() === 'pro') {
                    response = '24 hours';
                  } else {
                    response = '4 hours';
                  }
                  return (
                    <td key={`response-${plan.id}`} className="py-4 px-6 text-center">
                      {response}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* FAQ section */}
      <div className="max-w-3xl mx-auto pt-16">
        <h2 className="text-3xl font-bold text-center mb-10">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Frequently Asked Questions
          </span>
        </h2>
        <div className="space-y-6">
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-lg font-medium mb-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-1">
                <Info className="w-4 h-4" />
              </div>
              Can I cancel at any time?
            </h3>
            <p className="text-gray-400 pl-9">
              Yes, you can cancel your subscription at any time. You'll continue to have access to your plan until the end of your current billing cycle.
            </p>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-lg font-medium mb-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-1">
                <Info className="w-4 h-4" />
              </div>
              How does the free trial work?
            </h3>
            <p className="text-gray-400 pl-9">
              Our 7-day free trial gives you full access to all features of your chosen plan. No credit card is required to start, and you can cancel anytime during the trial period with no charges.
            </p>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-lg font-medium mb-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-1">
                <Info className="w-4 h-4" />
              </div>
              Can I change plans later?
            </h3>
            <p className="text-gray-400 pl-9">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and your billing will be adjusted proportionally.
            </p>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-lg font-medium mb-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-1">
                <Info className="w-4 h-4" />
              </div>
              What payment methods do you accept?
            </h3>
            <p className="text-gray-400 pl-9">
              We accept all major credit cards, including Visa, Mastercard, American Express, and Discover. For annual plans, we also offer invoicing options for enterprise customers.
            </p>
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-lg font-medium mb-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-1">
                <Info className="w-4 h-4" />
              </div>
              What happens if I exceed my plan limits?
            </h3>
            <p className="text-gray-400 pl-9">
              If you approach your plan limits, we'll notify you so you can either manage your usage or upgrade to a higher tier. We don't automatically charge overage fees without your consent.
            </p>
          </div>
        </div>
      </div>
      
    </div>
        
  );
}