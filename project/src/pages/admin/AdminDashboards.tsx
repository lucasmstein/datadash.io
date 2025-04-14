import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
interface Dashboard {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  file_info?: any;
  profiles?: {
    full_name: string;
  };
}

export function AdminDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboards();
  }, []);

  async function fetchDashboards() {
    try {
      setError(null);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!session || sessionError) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('dashboards')
        .select(`id, title, file_info, created_at, user_id, profiles:profiles(full_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const typedData = (data as any[]).map((item): Dashboard => ({
        id: item.id,
        title: item.title,
        file_info: item.file_info,
        created_at: item.created_at,
        user_id: item.user_id,
        profiles: item.profiles
      }));
      setDashboards(typedData);
    } catch (error) {
      console.error('Erro ao buscar dashboards:', error);
      setError('Erro ao buscar dashboards.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDashboards();
    } catch (error) {
      console.error('Erro ao deletar dashboard:', error);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 space-y-6 p-6">
        <h1 className="text-2xl font-bold">Gerenciar Dashboards</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-3 text-gray-400 font-medium">Título</th>
                    <th className="pb-3 text-gray-400 font-medium">Criado em</th>
                    <th className="pb-3 text-gray-400 font-medium">Usuário</th>
                    <th className="pb-3 text-gray-400 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboards.map((dashboard) => (
                    <tr key={dashboard.id} className="border-b border-gray-700/50">
                      <td className="py-4">
                        <div className="font-medium">{dashboard.title}</div>
                      </td>
                      <td className="py-4 text-gray-400">
                        {new Date(dashboard.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-gray-400">
                        {dashboard.profiles?.full_name || 'Desconhecido'}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                          className="text-blue-500 hover:text-blue-400 mr-4"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleDelete(dashboard.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {dashboards.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  Nenhum dashboard encontrado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}