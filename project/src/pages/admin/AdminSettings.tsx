import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Setting = {
  id: string;
  key: string;
  value: string;
  description: string;
};

export function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data, error } = await supabase.from('settings').select('*').order('created_at');
    if (error) {
      console.error('Erro ao buscar configurações:', error);
    } else {
      setSettings(data);
    }
    setLoading(false);
  }

  const handleChange = (index: number, value: string) => {
    const updated = [...settings];
    updated[index].value = value;
    setSettings(updated);
  };

  const saveSettings = async () => {
    setSaving(true);
    for (const setting of settings) {
      await supabase
        .from('settings')
        .update({ value: setting.value })
        .eq('id', setting.id);
    }
    setSaving(false);
    fetchSettings();
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API & Configurações do Sistema</h1>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting, index) => (
            <div key={setting.id} className="bg-gray-800 p-4 rounded-xl">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {setting.key}
              </label>
              <input
                type="text"
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
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      )}
    </div>
  );
}
