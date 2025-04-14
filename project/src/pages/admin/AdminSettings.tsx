import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Save } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data, error } = await supabase.from('settings').select('*');
    if (!error && data) {
      setSettings(data);
    }
    setLoading(false);
  }

  function handleChange(index: number, value: string) {
    const updated = [...settings];
    updated[index].value = value;
    setSettings(updated);
  }

  async function saveSettings() {
    setSaving(true);
    for (const setting of settings) {
      await supabase
        .from('settings')
        .update({ value: setting.value })
        .eq('id', setting.id);
    }
    setSaving(false);
    fetchSettings();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">API & Configurações do Sistema</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting, index) => (
            <div key={setting.id} className="bg-gray-800 p-4 rounded-xl">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {setting.key === 'stripe_pk' && 'Stripe Public Key (pk_test_...)'}
                {setting.key === 'stripe_sk' && 'Stripe Secret Key (sk_test_...)'}
                {setting.key !== 'stripe_pk' && setting.key !== 'stripe_sk' && setting.key}
              </label>
              <input
                type={setting.key.includes('sk') ? 'password' : 'text'}
                value={setting.value}
                onChange={(e) => handleChange(index, e.target.value)}
                className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-white"
              />
              {setting.description && (
                <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
              )}
            </div>
          ))}

          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      )}
    </div>
  );
}
