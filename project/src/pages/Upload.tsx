// Upload.tsx atualizado com correção de tipo em LimitModal e adição de formatDate e formatFileSize
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload as UploadIcon,
  FileSpreadsheet,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  FileType,
  BarChart2 as LucideBarChart2,
  Calculator,
  Database,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../hooks/useSubscription';
import { canUseLimit } from '../lib/planLimits';
import { LimitModal } from '../components/modals/LimitModal';

// Tipos auxiliares
type ColumnType = 'number' | 'date' | 'string';

interface ColumnAnalysis {
  name: string;
  type: ColumnType;
  sample: (string | number | null)[];
  stats?: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  uniqueValues: number;
  nullCount: number;
}

interface PreviewData {
  headers: string[];
  rows: Record<string, string>[];
}

interface RecentUpload {
  id: string;
  title: string;
  file_info: {
    name: string;
    size: number;
    type: string;
    uploaded_at: string;
  };
  created_at: string;
}

function detectColumnType(values: string[]): ColumnType {
  const nonEmptyValues = values.filter(Boolean);
  if (nonEmptyValues.length === 0) return 'string';
  const areAllNumbers = nonEmptyValues.every(value => !isNaN(Number(value)));
  if (areAllNumbers) return 'number';
  const dateRegex = /^\d{4}[-/]\d{2}[-/]\d{2}$/;
  const areAllDates = nonEmptyValues.every(value => dateRegex.test(value));
  if (areAllDates) return 'date';
  return 'string';
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[]; columnAnalysis: ColumnAnalysis[] } {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const headers = lines[0].split(',').map(header => header.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index]?.trim() ?? '';
      return obj;
    }, {} as Record<string, string>);
  });
  const columnAnalysis = headers.map(header => {
    const values = rows.map(row => row[header]);
    const type = detectColumnType(values);
    const processedValues = values.map(value => {
      if (!value) return null;
      if (type === 'number') return Number(value);
      if (type === 'date') return new Date(value).toISOString();
      return value;
    });

    let stats;
    if (type === 'number') {
      const numericValues = processedValues.filter(v => v !== null) as number[];
      if (numericValues.length > 0) {
        stats = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          avg: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
          median: numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)],
        };
      }
    }

    return {
      name: header,
      type,
      sample: processedValues.slice(0, 5),
      stats,
      uniqueValues: new Set(processedValues).size,
      nullCount: processedValues.filter(v => v === null).length,
    };
  });
  return { headers, rows, columnAnalysis };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function Upload(): JSX.Element {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { subscription } = useSubscription();
  const [limitFeature, setLimitFeature] = useState<'dashboards' | 'fileSizeMb' | 'aiRequests' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);

  useEffect(() => {
    async function loadRecentUploads() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('dashboards').select('id, title, file_info, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);
      setRecentUploads(data || []);
    }
    loadRecentUploads();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError(null);
      previewFile(droppedFile);
    } else {
      setError('Please upload a CSV file');
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'text/csv' || selectedFile?.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
      previewFile(selectedFile);
    } else {
      setError('Please upload a CSV file');
    }
  }, []);

  const previewFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').slice(0, 6);
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => {
          const values = line.split(',');
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index]?.trim() ?? '';
            return obj;
          }, {} as Record<string, string>);
        });
        setPreviewData({ headers, rows });
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: existingDashboards } = await supabase.from('dashboards').select('id').eq('user_id', user.id);
      if (!canUseLimit(subscription, 'dashboards', existingDashboards?.length || 0)) {
        setLimitFeature('dashboards');
        setLoading(false);
        return;
      }
      const fileSizeMb = file.size / (1024 * 1024);
      if (!canUseLimit(subscription, 'fileSizeMb', fileSizeMb)) {
        setLimitFeature('fileSizeMb');
        setLoading(false);
        return;
      }
      const text = await file.text();
      const { columnAnalysis } = parseCSV(text);
      const { data: dashboard, error: dbError } = await supabase.from('dashboards').insert({
        user_id: user.id,
        title: file.name.replace('.csv', ''),
        file_info: {
          name: file.name,
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString(),
        },
        column_analysis: columnAnalysis,
        insights: [],
        visualizations: [],
      }).select().single();
      if (dbError) throw dbError;
      setUploadProgress(100);
      setTimeout(() => navigate(`/dashboard/${dashboard.id}`), 500);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
            <UploadIcon className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Upload Your Data
            </h1>
            <p className="text-gray-400 mt-1">
              Upload a CSV file to create interactive dashboards and insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-500/20' 
                    : file 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-gray-700 hover:border-gray-500 bg-gray-900/60 backdrop-blur-sm'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="py-12 flex flex-col items-center justify-center text-center p-6">
                  {file ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-xl font-medium text-white mb-1">{file.name}</p>
                      <p className="text-sm text-gray-400 mb-4">
                        {formatFileSize(file.size)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewData(null);
                        }}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Remove File
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                        <UploadIcon className="w-10 h-10 text-blue-400" />
                      </div>
                      <p className="text-xl font-medium text-white mb-2">
                        Drop your CSV file here
                      </p>
                      <p className="text-sm text-gray-400 mb-6">
                        or click to browse from your computer
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Only CSV files are supported at this time
                      </p>
                    </>
                  )}
                </div>
              </div>

              {previewData && (
                <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 overflow-hidden">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    Data Preview
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          {previewData.headers.map((header, index) => (
                            <th key={index} className="py-2 px-3 text-left text-gray-400 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-gray-800">
                            {previewData.headers.map((header, colIndex) => (
                              <td key={colIndex} className="py-2 px-3 text-gray-300">
                                {row[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Showing first 5 rows of your data
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-xl">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {loading && (
                <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">Processing file...</span>
                      <span className="text-sm font-medium text-blue-400">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      We're analyzing your data and preparing your dashboard
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || loading}
                className={`w-full py-3 px-4 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all ${
                  !file || loading
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LucideBarChart2 className="w-5 h-5" />
                    Create Dashboard
                  </>
                )}
              </button>
            </form>
            
            {recentUploads.length > 0 && (
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
                <div className="space-y-3">
                  {recentUploads.map(dashboard => (
                    <div 
                      key={dashboard.id} 
                      className="flex items-center justify-between p-3 hover:bg-gray-800/40 rounded-lg cursor-pointer transition-colors"
                      onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{dashboard.title}</p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(dashboard.file_info.size)} • {formatDate(dashboard.created_at)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                Supported Features
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileType className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-300">Column Type Detection</p>
                    <p className="text-sm text-gray-400">Automatically identifies number, date, and string columns</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calculator className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-300">Statistical Analysis</p>
                    <p className="text-sm text-gray-400">Mean, median, max/min calculations for numeric data</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Database className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-300">Data Validation</p>
                    <p className="text-sm text-gray-400">Null value detection and unique value counting</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <LucideBarChart2 className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-300">AI-Powered Visualizations</p>
                    <p className="text-sm text-gray-400">Suggested charts and graphs based on your data</p>
                  </div>
                </li>
              </ul>
              
              <div className="pt-4 border-t border-gray-800">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Your {subscription?.subscription_plans?.name || 'current'} plan allows up to {' '}
                      <span className="font-semibold text-blue-400">
                        {subscription?.subscription_plans?.limits?.fileSizeMb === 999999 
                          ? 'unlimited' 
                          : subscription?.subscription_plans?.limits?.fileSizeMb + 'MB'}
                      </span> {' '}
                      per file upload and {' '}
                      <span className="font-semibold text-blue-400">
                        {subscription?.subscription_plans?.limits?.dashboards === 999999 
                          ? 'unlimited' 
                          : subscription?.subscription_plans?.limits?.dashboards}
                      </span> {' '}
                      dashboards.
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-pattern opacity-10"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white mb-3">Need help with your data?</h3>
                <p className="text-white/80 text-sm mb-4">
                  Our team can help you set up custom dashboards and extract insights from your data.
                </p>
                <button className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-white/90 transition-colors text-sm">
                  Book a Consultation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {limitFeature !== null && (
        <LimitModal
          open={true}
          feature={limitFeature as 'dashboards' | 'fileSizeMb' | 'aiRequests'}
          onClose={() => setLimitFeature(null)}
        />
      )}
    </>
  );
}
