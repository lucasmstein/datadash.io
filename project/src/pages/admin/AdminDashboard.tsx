import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  subscription_plans?: {
    name: string;
    price_monthly: number;
  };
}

export function AdminDashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        status,
        created_at,
        subscription_plans:subscription_plans(name, price_monthly)
      `);

      if (!error && data) {
        const typed = (data as any[]).map((sub) => ({
          id: sub.id,
          user_id: sub.user_id,
          status: sub.status,
          created_at: sub.created_at,
          subscription_plans: Array.isArray(sub.subscription_plans)
            ? sub.subscription_plans[0]
            : sub.subscription_plans
        }));
      
        setSubscriptions(typed);
      }
    setLoading(false);
  }

  const revenue = subscriptions.reduce((total, sub) => {
    return total + (sub.subscription_plans?.price_monthly || 0);
  }, 0);

  const planCounts = subscriptions.reduce((acc, sub) => {
    const planName = sub.subscription_plans?.name || 'Free';
    acc[planName] = (acc[planName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-gray-900 text-white shadow p-4">
              <p className="text-sm text-gray-400">Total de Assinaturas</p>
              <p className="text-2xl font-semibold">{subscriptions.length}</p>
            </div>
            <div className="rounded-xl border bg-gray-900 text-white shadow p-4">
              <p className="text-sm text-gray-400">Receita estimada</p>
              <p className="text-2xl font-semibold">R$ {(revenue).toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-xl border bg-gray-900 text-white shadow p-4">
              <p className="text-sm text-gray-400 mb-2">Planos</p>
              {Object.entries(planCounts).map(([plan, count]) => (
                <p key={plan} className="text-sm text-white">
                  {plan}: {count} usuário(s)
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
