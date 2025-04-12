import { OpenAI } from 'openai';
import { supabase } from './supabase';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through a backend
});

interface ColumnAnalysis {
  name: string;
  type: string;
  sample: any[];
  stats?: {
    min?: number;
    max?: number;
    avg?: number;
    median?: number;
  };
}

interface ChartSuggestion {
  type: 'line' | 'bar' | 'pie';
  title: string;
  description: string;
  x_axis: string;
  y_axis: string;
}

async function checkAIUsageLimit(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          limits
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subscription) return false;

    const currentUsage = subscription.usage?.ai_requests || 0;
    const limit = subscription.subscription_plans.limits.ai_requests;

    // Update usage counter
    if (currentUsage < limit) {
      await supabase
        .from('subscriptions')
        .update({
          usage: {
            ...subscription.usage,
            ai_requests: currentUsage + 1
          }
        })
        .eq('user_id', user.id);
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking AI usage limit:', error);
    return false;
  }
}

export async function generateInsights(columnAnalysis: ColumnAnalysis[]): Promise<string[]> {
  try {
    const hasAvailableUsage = await checkAIUsageLimit();
    if (!hasAvailableUsage) {
      throw new Error('AI usage limit reached. Please upgrade your plan for more AI features.');
    }

    const prompt = `Analyze this dataset and provide 3-5 key insights. Each insight should be clear and actionable.

Dataset columns:
${columnAnalysis.map(col => `${col.name} (${col.type})${col.stats ? ` - Range: ${col.stats.min} to ${col.stats.max}, Avg: ${col.stats.avg}` : ''}`).join('\n')}

Sample data:
${columnAnalysis.map(col => `${col.name}: ${col.sample.slice(0, 5).join(', ')}`).join('\n')}

Format each insight as a single sentence starting with a bullet point (•).`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const insights = response.choices[0].message.content
      ?.split('\n')
      .filter(line => line.trim().startsWith('•'))
      .map(line => line.trim().substring(1).trim()) || [];

    return insights;
  } catch (error: any) {
    console.error('Error generating insights:', error);
    throw new Error(error.message || 'Failed to generate insights');
  }
}

export async function suggestCharts(columnAnalysis: ColumnAnalysis[]): Promise<ChartSuggestion[]> {
  try {
    const hasAvailableUsage = await checkAIUsageLimit();
    if (!hasAvailableUsage) {
      throw new Error('AI usage limit reached. Please upgrade your plan for more AI features.');
    }

    const prompt = `Suggest 2-3 meaningful charts for visualizing this dataset. Consider relationships between variables and what would be most insightful.

Dataset columns:
${columnAnalysis.map(col => `${col.name} (${col.type})${col.stats ? ` - Range: ${col.stats.min} to ${col.stats.max}, Avg: ${col.stats.avg}` : ''}`).join('\n')}

Sample data:
${columnAnalysis.map(col => `${col.name}: ${col.sample.slice(0, 5).join(', ')}`).join('\n')}

Format each suggestion as JSON with the following structure:
{
  "type": "line|bar|pie",
  "title": "Chart title",
  "description": "Why this visualization is useful",
  "x_axis": "Column name for x-axis",
  "y_axis": "Column name for y-axis"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const suggestions = response.choices[0].message.content
      ?.split('\n')
      .filter(line => line.trim().startsWith('{'))
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((suggestion): suggestion is ChartSuggestion => suggestion !== null);

    return suggestions || [];
  } catch (error: any) {
    console.error('Error generating chart suggestions:', error);
    throw new Error(error.message || 'Failed to generate chart suggestions');
  }
}

export async function generateKPIs(columnAnalysis: ColumnAnalysis[]) {
  try {
    const hasAvailableUsage = await checkAIUsageLimit();
    if (!hasAvailableUsage) {
      throw new Error('AI usage limit reached. Please upgrade your plan for more AI features.');
    }

    const prompt = `Generate 3-4 key performance indicators (KPIs) based on this dataset.

Dataset columns:
${columnAnalysis.map(col => `${col.name} (${col.type})${col.stats ? ` - Range: ${col.stats.min} to ${col.stats.max}, Avg: ${col.stats.avg}` : ''}`).join('\n')}

Sample data:
${columnAnalysis.map(col => `${col.name}: ${col.sample.slice(0, 5).join(', ')}`).join('\n')}

Format each KPI as JSON with the following structure:
{
  "title": "KPI title",
  "description": "What this KPI measures",
  "calculation": "How to calculate this KPI",
  "columns": ["Column names needed"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const kpis = response.choices[0].message.content
      ?.split('\n')
      .filter(line => line.trim().startsWith('{'))
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(kpi => kpi !== null);

    return kpis || [];
  } catch (error: any) {
    console.error('Error generating KPIs:', error);
    throw new Error(error.message || 'Failed to generate KPIs');
  }
}