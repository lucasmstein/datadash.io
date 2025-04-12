import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Loader2,
  Plus,
  X,
  Trash2,
  Sparkles,
  Brain,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import { generateInsights, suggestCharts, generateKPIs } from '../lib/openai';
import type { Dashboard, ChartSuggestion } from '../types';
import { useSubscription } from '../hooks/useSubscription';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const CHART_TYPES = ['line', 'bar', 'pie'] as const;

type ChartType = typeof CHART_TYPES[number];

interface NewVisualization {
  type: ChartType;
  title: string;
  x_axis: string;
  y_axis: string;
}

export function DashboardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewVizModal, setShowNewVizModal] = useState(false);
  const [newViz, setNewViz] = useState<NewVisualization>({
    type: 'line',
    title: '',
    x_axis: '',
    y_axis: ''
  });
  const [savingViz, setSavingViz] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [chartSuggestions, setChartSuggestions] = useState<ChartSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const { data, error } = await supabase
          .from('dashboards')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Dashboard not found');
        
        setDashboard(data);

        // Load existing insights if available
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [id]);

  const handleGenerateInsights = async () => {
    if (!dashboard) return;
    
    setGeneratingInsights(true);
    setError(null);
    
    try {
      // Generate insights and chart suggestions in parallel
      const [newInsights, suggestions] = await Promise.all([
        generateInsights(dashboard.column_analysis),
        suggestCharts(dashboard.column_analysis)
      ]);

      setInsights(newInsights);
      setChartSuggestions(suggestions);
      setShowSuggestions(true);

      // Save insights to the dashboard
      const { error: updateError } = await supabase
        .from('dashboards')
        .update({ insights: newInsights })
        .eq('id', dashboard.id);

      if (updateError) throw updateError;

      // Update local state
      setDashboard(prev => prev ? {
        ...prev,
        insights: newInsights
      } : null);
    } catch (err: any) {
      if (err.message.includes('AI usage limit reached')) {
        setShowUpgradeModal(true);
      } else {
        setError('Failed to generate insights: ' + err.message);
      }
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleCreateVisualization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboard) return;

    setSavingViz(true);
    try {
      // Create visualization data from column analysis
      const xColumn = dashboard.column_analysis.find(col => col.name === newViz.x_axis);
      const yColumn = dashboard.column_analysis.find(col => col.name === newViz.y_axis);

      if (!xColumn || !yColumn) throw new Error('Selected columns not found');

      const data = xColumn.sample.map((_, index) => {
        const xValue = xColumn.sample[index];
        const yValue = yColumn.sample[index];
        return {
          [newViz.x_axis]: xValue,
          [newViz.y_axis]: yValue
        };
      }).filter(item => item[newViz.x_axis] != null && item[newViz.y_axis] != null);

      const visualization = {
        id: crypto.randomUUID(),
        type: newViz.type,
        title: newViz.title,
        x_axis: newViz.x_axis,
        y_axis: newViz.y_axis,
        data
      };

      const { error } = await supabase
        .from('dashboards')
        .update({
          visualizations: [...(dashboard.visualizations || []), visualization]
        })
        .eq('id', dashboard.id);

      if (error) throw error;

      setDashboard(prev => prev ? {
        ...prev,
        visualizations: [...(prev.visualizations || []), visualization]
      } : null);

      setShowNewVizModal(false);
      setNewViz({ type: 'line', title: '', x_axis: '', y_axis: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingViz(false);
    }
  };

  const handleApplySuggestion = (suggestion: ChartSuggestion) => {
    setNewViz({
      type: suggestion.type,
      title: suggestion.title,
      x_axis: suggestion.x_axis,
      y_axis: suggestion.y_axis
    });
    setShowNewVizModal(true);
    setShowSuggestions(false);
  };

  const handleDeleteVisualization = async (vizId: string) => {
    if (!dashboard) return;

    try {
      const updatedVisualizations = dashboard.visualizations.filter(v => v.id !== vizId);
      
      const { error } = await supabase
        .from('dashboards')
        .update({ visualizations: updatedVisualizations })
        .eq('id', dashboard.id);

      if (error) throw error;

      setDashboard(prev => prev ? {
        ...prev,
        visualizations: updatedVisualizations
      } : null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExportPDF = async () => {
    if (!dashboard) return;
    setExportingPDF(true);

    try {
      const doc = new jsPDF();
      let yOffset = 20;

      // Add title
      doc.setFontSize(20);
      doc.text(dashboard.title, 20, yOffset);
      yOffset += 10;

      // Add metadata
      doc.setFontSize(12);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, yOffset);
      yOffset += 20;

      // Add insights if available
      if (insights.length > 0) {
        doc.setFontSize(16);
        doc.text('Key Insights', 20, yOffset);
        yOffset += 10;

        doc.setFontSize(12);
        insights.forEach(insight => {
          doc.text('• ' + insight, 20, yOffset);
          yOffset += 10;
        });
        yOffset += 10;
      }

      // Add column analysis
      doc.setFontSize(16);
      doc.text('Data Analysis', 20, yOffset);
      yOffset += 10;

      dashboard.column_analysis.forEach(column => {
        doc.setFontSize(14);
        doc.text(`${column.name} (${column.type})`, 20, yOffset);
        yOffset += 10;

        if (column.stats) {
          doc.setFontSize(12);
          Object.entries(column.stats).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`, 30, yOffset);
            yOffset += 7;
          });
        }

        yOffset += 5;
      });

      // Save the PDF
      doc.save(`${dashboard.title}-analysis.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
        <p className="text-gray-400">{error || 'Failed to load dashboard'}</p>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary mt-6"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dashboard.title}</h1>
          <p className="text-gray-400 mt-1">
            Uploaded {new Date(dashboard.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateInsights}
            disabled={generatingInsights}
            className="btn btn-secondary flex items-center"
          >
            {generatingInsights ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyze Data
              </>
            )}
          </button>
          <button 
            onClick={() => setShowNewVizModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Visualization
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="btn btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportingPDF ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Key Insights</h2>
          </div>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboard.column_analysis.map((column) => (
          <div key={column.name} className="card">
            <h3 className="text-lg font-medium mb-2">{column.name}</h3>
            <p className="text-sm text-gray-400 mb-4">
              Type: {column.type}
            </p>
            {column.stats && (
              <div className="mb-4 space-y-2">
                {Object.entries(column.stats).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-400">{key}:</span>
                    <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {column.sample.slice(0, 3).map((value, i) => (
                <div
                  key={i}
                  className="text-sm bg-gray-700/50 px-3 py-2 rounded-lg"
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {dashboard.visualizations && dashboard.visualizations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboard.visualizations.map((viz) => (
            <div key={viz.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{viz.title}</h3>
                <button
                  onClick={() => handleDeleteVisualization(viz.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {viz.type === 'line' ? (
                    <LineChart data={viz.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={viz.x_axis} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={viz.y_axis}
                        stroke="#3B82F6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  ) : viz.type === 'bar' ? (
                    <BarChart data={viz.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={viz.x_axis} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey={viz.y_axis} fill="#3B82F6" />
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={viz.data}
                        dataKey={viz.y_axis}
                        nameKey={viz.x_axis}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {viz.data.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="flex justify-center space-x-4 mb-6">
            <BarChartIcon className="w-8 h-8 text-gray-400" />
            <LineChartIcon className="w-8 h-8 text-gray-400" />
            <PieChartIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-300 mb-2">
            No visualizations yet
          </h3>
          <p className="text-gray-400 mb-6">
            Create visualizations to better understand your data
          </p>
          <button
            onClick={() => setShowNewVizModal(true)}
            className="btn btn-primary flex items-center mx-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Visualization
          </button>
        </div>
      )}

      {showSuggestions && chartSuggestions.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h3 className="text-xl font-semibold">Suggested Visualizations</h3>
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {chartSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium mb-1">{suggestion.title}</h4>
                      <p className="text-sm text-gray-400 mb-2">
                        {suggestion.description}
                      </p>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">Type:</span> {suggestion.type} chart
                        <span className="mx-2">•</span>
                        <span className="text-gray-400">X-axis:</span> {suggestion.x_axis}
                        <span className="mx-2">•</span>
                        <span className="text-gray-400">Y-axis:</span> {suggestion.y_axis}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="btn btn-primary"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showNewVizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Create Visualization</h3>
              <button
                onClick={() => setShowNewVizModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVisualization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Visualization Title
                </label>
                <input
                  type="text"
                  value={newViz.title}
                  onChange={(e) => setNewViz(prev => ({ ...prev, title: e.target.value }))}
                  className="input w-full"
                  placeholder="Enter a title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Chart Type
                </label>
                <select
                  value={newViz.type}
                  onChange={(e) => setNewViz(prev => ({ ...prev, type: e.target.value as ChartType }))}
                  className="input w-full"
                  required
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  X-Axis Column
                </label>
                <select
                  value={newViz.x_axis}
                  onChange={(e) => setNewViz(prev => ({ ...prev, x_axis: e.target.value }))}
                  className="input w-full"
                  required
                >
                  <option value="">Select a column</option>
                  {dashboard.column_analysis.map((column) => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Y-Axis Column
                </label>
                <select
                  value={newViz.y_axis}
                  onChange={(e) => setNewViz(prev => ({ ...prev, y_axis: e.target.value }))}
                  className="input w-full"
                  required
                >
                  <option value="">Select a column</option>
                  {dashboard.column_analysis.map((column) => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewVizModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingViz}
                  className="btn btn-primary flex items-center"
                >
                  {savingViz ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Visualization'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <h3 className="text-xl font-semibold">Upgrade Required</h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              You've reached your AI analysis limit. Upgrade your plan to unlock unlimited AI-powered insights and visualizations.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="btn btn-secondary"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate('/plans?upgrade=true');
                }}
                className="btn btn-primary flex items-center"
              >
                Upgrade Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}