import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../hooks/useSubscription';
import { canUseLimit } from '../lib/planLimits';
import { LimitModal } from '../components/modals/LimitModal';

function detectColumnType(values: string[]): 'number' | 'date' | 'string' {
  const nonEmptyValues = values.filter(Boolean);
  if (nonEmptyValues.length === 0) return 'string';
  const areAllNumbers = nonEmptyValues.every(value => !isNaN(Number(value)));
  if (areAllNumbers) return 'number';
  const dateRegex = /^\d{4}[-/]\d{2}[-/]\d{2}$/;
  const areAllDates = nonEmptyValues.every(value => dateRegex.test(value));
  if (areAllDates) return 'date';
  return 'string';
}

function parseCSV(text: string) {
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
      stats = {
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
        median: numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)],
      };
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

export function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { subscription } = useSubscription();
  const [limitFeature, setLimitFeature] = useState<null | 'dashboards' | 'fileSizeMb'>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a CSV file');
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'text/csv' || selectedFile?.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a CSV file');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      const { data: existingDashboards } = await supabase
        .from('dashboards')
        .select('id')
        .eq('user_id', user.id);

      if (!canUseLimit(subscription, 'dashboards', existingDashboards?.length || 0)) {
        setLimitFeature('dashboards');
        return;
      }

      const fileSizeMb = file.size / (1024 * 1024);
      if (!canUseLimit(subscription, 'fileSizeMb', fileSizeMb)) {
        setLimitFeature('fileSizeMb');
        return;
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const text = await file.text();
      const { columnAnalysis } = parseCSV(text);

      const { data: dashboard, error: dbError } = await supabase
        .from('dashboards')
        .insert({
          user_id: user.id,
          title: file.name.replace('.csv', ''),
          file_info: {
            name: file.name,
            size: file.size,
            type: file.type,
            uploaded_at: new Date().toISOString()
          },
          column_analysis: columnAnalysis,
          insights: [],
          visualizations: []
        })
        .select()
        .single();

      if (dbError) throw dbError;

      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        navigate(`/dashboard/${dashboard.id}`);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Data</h1>
        <p className="text-gray-400 mt-2">Upload a CSV file to create a new dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`card relative border-2 border-dashed ${
            file ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-blue-500'
          } rounded-2xl transition-colors`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="py-12 flex flex-col items-center justify-center text-center">
            {file ? (
              <>
                <FileSpreadsheet className="w-12 h-12 text-blue-500 mb-4" />
                <p className="text-lg font-medium text-white mb-1">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="mt-4 btn btn-secondary flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </button>
              </>
            ) : (
              <>
                <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-white mb-1">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-gray-400">
                  or click to browse from your computer
                </p>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 text-center">
              Processing file... {uploadProgress}%
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="btn btn-primary w-full flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Create Dashboard'
          )}
        </button>
      </form>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Supported Features</h2>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
            Automatic column type detection (number, date, string)
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
            Statistical analysis for numeric columns
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
            Data sampling for quick preview
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
            Null value detection and handling
          </li>
        </ul>
      </div>
    </div>
    <LimitModal
    open={!!limitFeature}
    feature={limitFeature!}
    onClose={() => setLimitFeature(null)}
  />
</>
  );
}