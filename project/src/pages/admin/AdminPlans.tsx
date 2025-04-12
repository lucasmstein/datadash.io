import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export function AdminPlans() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscription Plans</h1>
      
      <div className="space-y-4">
        {plans?.map((plan) => (
          <div 
            key={plan.id} 
            className="card flex justify-between items-center"
          >
            <div>
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-gray-400">{plan.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                ${plan.price_monthly}/month
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  // TODO: Implement edit functionality
                }}
              >
                Edit
              </button>
              <button 
                className="btn bg-red-500/10 text-red-500 hover:bg-red-500/20"
                onClick={() => {
                  // TODO: Implement delete functionality
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}