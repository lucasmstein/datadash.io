export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  created_at: string;
}

export interface Dashboard {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  file_info: {
    name: string;
    size: number;
    type: string;
  };
  column_analysis: {
    name: string;
    type: 'string' | 'number' | 'date';
    sample: any[];
    stats?: {
      min?: number;
      max?: number;
      avg?: number;
      median?: number;
    };
  }[];
  insights: string[];
  visualizations: Visualization[];
}

export interface Visualization {
  id: string;
  type: 'line' | 'bar' | 'pie';
  title: string;
  x_axis: string;
  y_axis: string;
  data: Record<string, any>[];
}

export interface ChartSuggestion {
  type: 'line' | 'bar' | 'pie';
  title: string;
  description: string;
  x_axis: string;
  y_axis: string;
}

export interface KPI {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}