const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatResponse {
  answer: string;
  agent_trace: Array<{
    agent_name: string;
    reason: string;
    decision: string;
  }>;
  sources: string[];
}

export interface HealthReportResponse {
  extracted_values: Record<string, any>;
  explanation: string;
  why: string;
  guidelines_used: string[];
}

export interface CommunityTrendItem {
  week: string;
  cases: number;
  rainfall_mm: number;
}

export interface HealthCommunityResponse {
  ward: string;
  historical_trends: CommunityTrendItem[];
  predicted_risk: string;
  recommendations: string[];
  why: string;
}

export interface EnvCurrentResponse {
  city: string;
  aqi: number;
  aqi_us: number;
  aqi_cpcb: number;
  temperature: number;
  rainfall: number;
  category: string;
  is_safe: boolean;
  recommendations: string[];
  why: string;
}

export interface AQITrendItem {
  date: string;
  aqi: number;
}

export interface EnvForecastResponse {
  city: string;
  historical: AQITrendItem[];
  forecast: AQITrendItem[];
  why: string;
}

export interface ComplaintResponse {
  id: number;
  description: string;
  category: string;
  severity: string;
  suggested_routing: string;
  why: string;
  created_at: string;
}

export async function postChat(query: string): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch chat');
  }
  return res.json();
}

export async function analyzeReport(file: File): Promise<HealthReportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/health/analyze-report`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to analyze report');
  }
  return res.json();
}

export async function getCommunityTrend(ward: string): Promise<HealthCommunityResponse> {
  const res = await fetch(`${BASE_URL}/api/health/community-trend?ward=${encodeURIComponent(ward)}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch community trends');
  }
  return res.json();
}

export async function getCurrentEnv(city: string): Promise<EnvCurrentResponse> {
  const res = await fetch(`${BASE_URL}/api/environment/current?city=${encodeURIComponent(city)}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch current environment data');
  }
  return res.json();
}

export async function getEnvForecast(city: string): Promise<EnvForecastResponse> {
  const res = await fetch(`${BASE_URL}/api/environment/forecast?city=${encodeURIComponent(city)}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch environment forecast');
  }
  return res.json();
}

export async function submitComplaint(description: string, file?: File): Promise<ComplaintResponse> {
  const formData = new FormData();
  formData.append('description', description);
  if (file) {
    formData.append('file', file);
  }
  const res = await fetch(`${BASE_URL}/api/complaints`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to submit complaint');
  }
  return res.json();
}

export async function getComplaints(): Promise<ComplaintResponse[]> {
  const res = await fetch(`${BASE_URL}/api/complaints`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch complaints');
  }
  return res.json();
}
