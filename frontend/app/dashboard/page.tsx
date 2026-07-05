"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Wind, Thermometer, Droplets, BarChart3, MapPin, ClipboardList, Send, FileImage, Building, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  getCurrentEnv, getEnvForecast, getCommunityTrend, 
  submitComplaint, getComplaints, 
  EnvCurrentResponse, EnvForecastResponse, HealthCommunityResponse, ComplaintResponse 
} from '../../lib/api';
import HealthPredictionCard from '@/components/HealthPredictionCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AQIMap = dynamic(() => import('@/components/AQIMap'), { ssr: false });

const CITIES = ["Patna", "Delhi", "Mumbai", "Bengaluru"];
const WARDS = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];

function aqiStatusColor(aqi: number) {
  if (aqi <= 100) return 'var(--ok)';
  if (aqi <= 200) return 'var(--warn)';
  return 'var(--alert)';
}

function aqiUsCategory(aqi: number) {
  if (aqi <= 50)  return 'GOOD';
  if (aqi <= 100) return 'MODERATE';
  if (aqi <= 150) return 'UNHEALTHY SG';
  if (aqi <= 200) return 'UNHEALTHY';
  if (aqi <= 300) return 'VERY UNHEALTHY';
  return 'HAZARDOUS';
}

function aqiCpcbCategory(aqi: number) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

function formatAqi(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(1);
}

function KpiCard({ label, icon, loading, children }: {
  label: string; icon: React.ReactNode; loading: boolean; children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--z2)',
        border: '1px solid var(--border-default)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'background 150ms, box-shadow 150ms',
      }}
      className="hover:bg-[var(--z3)] hover:shadow-[var(--shadow-md)]"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ color: 'var(--ink-3)' }}>{icon}</span>
      </div>
      {loading
        ? <div className="skeleton" style={{ height: 52, borderRadius: 4, width: '60%' }} />
        : children}
    </div>
  );
}

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState("Patna");
  const [selectedWard, setSelectedWard] = useState("Ward 3");
  const [activeTab, setActiveTab] = useState<"indicators" | "complaints">("indicators");
  
  const [currentEnv, setCurrentEnv] = useState<EnvCurrentResponse | null>(null);
  const [forecastEnv, setForecastEnv] = useState<EnvForecastResponse | null>(null);
  const [healthTrend, setHealthTrend] = useState<HealthCommunityResponse | null>(null);
  const [mapCities, setMapCities] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  
  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [complaintText, setComplaintText] = useState("");
  const [complaintFile, setComplaintFile] = useState<File | undefined>(undefined);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [lastComplaintResult, setLastComplaintResult] = useState<ComplaintResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadEnvData() {
      setLoadingStats(true);
      try {
        const [current, forecast] = await Promise.all([getCurrentEnv(selectedCity), getEnvForecast(selectedCity)]);
        setCurrentEnv(current);
        setForecastEnv(forecast);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        const coords: Record<string, { lat: number; lon: number }> = {
          "Patna": { lat: 25.5941, lon: 85.1376 },
          "Delhi": { lat: 28.7041, lon: 77.1025 },
          "Mumbai": { lat: 19.0760, lon: 72.8777 },
          "Bengaluru": { lat: 12.9716, lon: 77.5946 },
        };
        const mapData = await Promise.all(
          CITIES.map(async (c) => {
            const res = await getCurrentEnv(c);
            return { name: c, lat: coords[c].lat, lon: coords[c].lon, aqi: res.aqi, category: res.category };
          })
        );
        setMapCities(mapData);
      } catch (err) { console.error(err); }
      finally { setLoadingStats(false); }
    }
    loadEnvData();
  }, [selectedCity]);

  useEffect(() => {
    async function loadHealthData() {
      try {
        const trend = await getCommunityTrend(selectedWard);
        setHealthTrend(trend);
      } catch (err) { console.error(err); }
    }
    loadHealthData();
  }, [selectedWard]);

  const loadComplaintsList = async () => {
    try { setComplaints(await getComplaints()); } catch (err) { console.error(err); }
  };

  useEffect(() => { if (activeTab === "complaints") loadComplaintsList(); }, [activeTab]);

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setSubmittingComplaint(true);
    setLastComplaintResult(null);
    try {
      const result = await submitComplaint(complaintText, complaintFile);
      setLastComplaintResult(result);
      setComplaintText("");
      setComplaintFile(undefined);
      loadComplaintsList();
    } catch (err) { console.error(err); }
    finally { setSubmittingComplaint(false); }
  };

  const getChartData = () => {
    if (!forecastEnv) return [];
    const hist = forecastEnv.historical.map(h => ({ name: h.date.substring(5), Historical: h.aqi, Forecast: null }));
    const last = forecastEnv.historical[forecastEnv.historical.length - 1];
    const fore = [
      { name: last.date.substring(5), Historical: last.aqi, Forecast: last.aqi },
      ...forecastEnv.forecast.map(f => ({ name: f.date.substring(5), Historical: null, Forecast: f.aqi })),
    ];
    return [...hist, ...fore];
  };

  const aColor = currentEnv ? aqiStatusColor(currentEnv.aqi) : 'var(--ok)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink-1)', margin: 0 }}>
            Decision Intelligence Control Center
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            Real-time sensory telemetry and predictive model tracking across departments.
          </p>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok)', animation: 'pulse-ok 2.5s infinite', display: 'inline-block' }} />
            UPDATED {lastUpdated} IST
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: 0 }}>
        {(['indicators', 'complaints'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--ink-1)' : 'var(--ink-3)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid var(--ok)` : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 120ms',
              textTransform: 'capitalize',
              marginBottom: -1,
              letterSpacing: '0.01em',
            }}
          >
            {tab === 'indicators' ? 'Sensors & Health' : 'Citizen Complaints'}
          </button>
        ))}
      </div>

      {activeTab === "indicators" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="max-md:grid-cols-1">
            {[
              { label: 'Active Station', val: selectedCity, set: setSelectedCity, items: CITIES },
              { label: 'Epidemiology Ward', val: selectedWard, set: setSelectedWard, items: WARDS },
            ].map(ctrl => (
              <div key={ctrl.label}
                style={{
                  background: 'var(--z2)',
                  border: '1px solid var(--border-default)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{ctrl.label}</span>
                <select
                  value={ctrl.val}
                  onChange={e => ctrl.set(e.target.value)}
                  style={{
                    background: 'var(--z3)',
                    border: '1px solid var(--border-active)',
                    color: 'var(--ink-1)',
                    fontSize: 12,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    outline: 'none',
                    borderRadius: 4,
                  }}
                >
                  {ctrl.items.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* ━━ LEVEL 1: Dominant KPIs ━━ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="max-md:grid-cols-1">
            <KpiCard label="Air Quality Index" icon={<Wind size={14} />} loading={loadingStats}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 52, fontWeight: 500, lineHeight: 1, color: aColor }}>
                  {formatAqi(currentEnv?.aqi_us ?? currentEnv?.aqi ?? 0)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: aColor, border: `1px solid ${aColor}`, padding: '2px 6px', borderRadius: 2, opacity: 0.8 }}>
                    {currentEnv ? aqiUsCategory(currentEnv.aqi_us ?? currentEnv.aqi) : '—'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{selectedCity} · AQI-US</span>
                </div>
                {currentEnv && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>
                    CPCB AQI: {formatAqi(currentEnv.aqi_cpcb ?? currentEnv.aqi)} ({aqiCpcbCategory(currentEnv.aqi_cpcb ?? currentEnv.aqi)}) · Live AQI-US: {formatAqi(currentEnv.aqi_us ?? currentEnv.aqi)} ({aqiUsCategory(currentEnv.aqi_us ?? currentEnv.aqi)})
                  </div>
                )}
              </div>
            </KpiCard>

            <KpiCard label="Temperature" icon={<Thermometer size={14} />} loading={loadingStats}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 52, fontWeight: 500, lineHeight: 1, color: 'var(--data)' }}>
                  {currentEnv?.temperature ?? '—'}<span style={{ fontSize: 28 }}>°C</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>Outdoor thermometer</div>
              </div>
            </KpiCard>

            <KpiCard label="Rainfall" icon={<Droplets size={14} />} loading={loadingStats}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 52, fontWeight: 500, lineHeight: 1, color: 'var(--data)' }}>
                  {currentEnv?.rainfall ?? '—'}<span style={{ fontSize: 22 }}> mm</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>Precipitation sensor</div>
              </div>
            </KpiCard>
          </div>

          {/* ━━ LEVEL 2: Map + Chart ━━ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="max-lg:grid-cols-1">
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={11} /> GEOGRAPHICAL AQI MONITORING
              </div>
              {mapCities.length > 0 ? (
                <AQIMap cities={mapCities} selectedCity={selectedCity} onSelectCity={setSelectedCity} />
              ) : (
                <div className="skeleton" style={{ height: 380, borderRadius: 4 }} />
              )}
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={11} /> 7-DAY TREND + 48H FORECAST
              </div>
              <div style={{ background: 'var(--z2)', border: '1px solid var(--border-default)', padding: 20, height: 380, boxShadow: 'var(--shadow-sm)' }}>
                {forecastEnv && !loadingStats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="2 4" />
                      <XAxis dataKey="name" stroke="var(--ink-3)" fontSize={10} fontFamily="var(--font-mono)" tick={{ fill: 'var(--ink-3)' }} />
                      <YAxis stroke="var(--ink-3)" fontSize={10} fontFamily="var(--font-mono)" tick={{ fill: 'var(--ink-3)' }} />
                      <Tooltip
                        contentStyle={{ background: 'var(--z3)', border: '1px solid var(--border-default)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}
                        labelStyle={{ color: 'var(--ink-2)' }}
                        itemStyle={{ color: 'var(--ink-1)' }}
                      />
                      <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }} />
                      <Line name="Historical AQI" type="monotone" dataKey="Historical" stroke="var(--ok)" strokeWidth={1.5} dot={{ r: 3, fill: 'var(--ok)', strokeWidth: 0 }} connectNulls />
                      <Line name="Model Forecast" type="monotone" dataKey="Forecast" stroke="var(--warn)" strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 3, fill: 'var(--warn)', strokeWidth: 0 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 4 }} />
                )}
              </div>
            </div>
          </div>

          {/* ━━ LEVEL 3: Briefing + Health ━━ */}
          {currentEnv && (
            <div style={{ background: 'var(--z2)', borderLeft: '3px solid var(--ok)', padding: '16px 20px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                AMBIENT SAFETY BRIEFING — {selectedCity.toUpperCase()}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{currentEnv.why}</p>
            </div>
          )}

          {healthTrend ? (
            <HealthPredictionCard
              ward={healthTrend.ward}
              predictedRisk={healthTrend.predicted_risk}
              recommendations={healthTrend.recommendations}
              why={healthTrend.why}
            />
          ) : (
            <div className="skeleton" style={{ height: 200, borderRadius: 4 }} />
          )}
        </div>
      )}

      {activeTab === "complaints" && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }} className="max-lg:grid-cols-1">
          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--z2)', border: '1px solid var(--border-default)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>Submit Grievance</h2>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
                  AI classifies priority and routes to the correct department automatically.
                </p>
              </div>

              <form onSubmit={handleComplaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Describe Complaint
                  </label>
                  <textarea
                    value={complaintText}
                    onChange={e => setComplaintText(e.target.value)}
                    required rows={5}
                    placeholder="e.g. Sewage overflow at Ward 3 junction causing mosquito breeding..."
                    style={{
                      width: '100%',
                      background: 'var(--z1)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--ink-1)',
                      fontSize: 13,
                      padding: '10px 14px',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.55,
                      borderRadius: 4,
                      fontFamily: 'var(--font-sans)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--border-active)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Attach Photo (Optional)
                  </label>
                  <div
                    style={{
                      position: 'relative',
                      border: '1px dashed var(--border-default)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 120ms',
                      borderRadius: 4,
                    }}
                    className="hover:border-[var(--border-active)]"
                  >
                    <input type="file" accept="image/*" onChange={e => setComplaintFile(e.target.files?.[0])}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    <FileImage size={18} style={{ color: 'var(--ink-3)', marginBottom: 6 }} />
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      {complaintFile ? complaintFile.name : 'Upload JPEG / PNG'}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingComplaint || !complaintText.trim()}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 4 }}
                >
                  <Send size={13} />
                  {submittingComplaint ? 'Transmitting...' : 'Submit Complaint'}
                </button>
              </form>
            </div>

            {lastComplaintResult && (
              <div style={{ background: 'var(--z2)', border: '1px solid var(--border-default)', borderLeft: '3px solid var(--ok)', padding: '20px 20px 20px 18px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)', letterSpacing: '0.1em', marginBottom: 14 }}>
                  <CheckCircle size={12} /> AI CLASSIFICATION COMPLETE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    { key: 'Category', val: lastComplaintResult.category, color: 'var(--ink-1)' },
                    { key: 'Severity', val: lastComplaintResult.severity, color: 'var(--alert)' },
                  ].map(f => (
                    <div key={f.key} style={{ background: 'var(--z3)', padding: '10px 12px', borderRadius: 4 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{f.key}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: f.color }}>{f.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--z3)', padding: '10px 12px', borderRadius: 4, marginBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Routing</div>
                  <div style={{ fontSize: 13, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building size={12} /> {lastComplaintResult.suggested_routing}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6, margin: 0 }}>{lastComplaintResult.why}</p>
              </div>
            )}
          </div>

          {/* Complaints table */}
          <div style={{ background: 'var(--z2)', border: '1px solid var(--border-default)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={15} style={{ color: 'var(--ok)' }} />
              Complaint Log Registry
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-sans)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['ID', 'Description', 'Category', 'Severity', 'Routing'].map(h => (
                      <th key={h} style={{ padding: '0 12px 12px 0', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {complaints.length > 0 ? complaints.map(c => {
                    const isCrit = ['critical', 'high'].includes(c.severity.toLowerCase());
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 120ms' }}
                        className="hover:bg-[var(--z3)]"
                      >
                        <td style={{ padding: '12px 12px 12px 0', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', fontSize: 11 }}>#{c.id}</td>
                        <td style={{ padding: '12px 12px 12px 0', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-2)' }} title={c.description}>{c.description}</td>
                        <td style={{ padding: '12px 12px 12px 0', color: 'var(--ink-1)', fontWeight: 500 }}>{c.category}</td>
                        <td style={{ padding: '12px 12px 12px 0' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
                            color: isCrit ? 'var(--alert)' : 'var(--warn)',
                            border: `1px solid ${isCrit ? 'var(--alert)' : 'var(--warn)'}`,
                            padding: '2px 6px', borderRadius: 2, opacity: 0.85
                          }}>
                            {c.severity.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 0 12px 0', color: 'var(--ok)', fontSize: 12 }}>{c.suggested_routing}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em' }}>
                        NO ACTIVE GRIEVANCES IN REGISTRY
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
