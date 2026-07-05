"use client";
import React, { useState, useEffect } from 'react';
import { Wind, Thermometer, Droplets, ShieldAlert } from 'lucide-react';
import { getCurrentEnv, getEnvForecast, EnvCurrentResponse, EnvForecastResponse } from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CITIES = ["Patna", "Delhi", "Mumbai", "Bengaluru"];

function aqiStatusColor(aqi: number): string {
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

const CPCB_TABLE = [
  { range: '0 – 50',   cat: 'Good',        col: 'var(--ok)',    note: 'Minimal health impact. Safe for all outdoor activities.' },
  { range: '51 – 100', cat: 'Satisfactory', col: 'var(--ok)',    note: 'Minor breathing discomfort to people with lung disease.' },
  { range: '101 – 200',cat: 'Moderate',     col: 'var(--warn)',  note: 'May cause breathing discomfort to asthma/heart disease patients.' },
  { range: '201 – 300',cat: 'Poor',         col: 'var(--warn)',  note: 'Breathing discomfort to most on prolonged exposure.' },
  { range: '301 – 400',cat: 'Very Poor',    col: 'var(--alert)', note: 'Respiratory illness on prolonged exposure. Avoid outdoors.' },
  { range: '401 – 500',cat: 'Severe',       col: 'var(--alert)', note: 'Serious health impact. Complete outdoor avoidance essential.' },
];

export default function EnvironmentPage() {
  const [selectedCity, setSelectedCity] = useState("Patna");
  const [currentEnv, setCurrentEnv] = useState<EnvCurrentResponse | null>(null);
  const [forecastEnv, setForecastEnv] = useState<EnvForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cur, fore] = await Promise.all([getCurrentEnv(selectedCity), getEnvForecast(selectedCity)]);
        setCurrentEnv(cur);
        setForecastEnv(fore);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadData();
  }, [selectedCity]);

  const getChartData = () => {
    if (!forecastEnv) return [];
    const hist = forecastEnv.historical.map(h => ({ name: h.date.substring(5), Historical: h.aqi, Forecast: null }));
    const last = forecastEnv.historical[forecastEnv.historical.length - 1];
    return [
      ...hist,
      { name: last.date.substring(5), Historical: last.aqi, Forecast: last.aqi },
      ...forecastEnv.forecast.map(f => ({ name: f.date.substring(5), Historical: null, Forecast: f.aqi })),
    ];
  };

  const aColor = currentEnv ? aqiStatusColor(currentEnv.aqi) : 'var(--ok)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink-1)', margin: 0 }}>
            Ambient Sensory Telemetry & Forecasts
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            Live AQI-US sensors · 48h predictive models · Personal outdoor safety audits · CPCB references
          </p>
        </div>
        <select
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
          style={{
            background: 'var(--z3)', border: '1px solid var(--border-active)',
            color: 'var(--ink-1)', fontSize: 13, fontWeight: 600,
            padding: '7px 14px', outline: 'none', cursor: 'pointer', borderRadius: 6,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }} className="max-lg:grid-cols-1">
        {/* Outdoor Safety Auditor */}
        <div style={{ background: 'var(--z2)', border: '1px solid var(--border-default)', padding: 28, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              MOD.02 // OUTDOOR-SAFETY-AUDITOR
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--ink-1)', margin: 0 }}>
              Outdoor Safety Auditor
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.6 }}>
              Evaluates if it is safe to exercise, commute or play outdoors based on current sensor data for {selectedCity}.
            </p>
          </div>

          {loading
            ? <>
                <div className="skeleton" style={{ height: 80, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 120, borderRadius: 4 }} />
              </>
            : currentEnv && (
              <>
                {/* Safety verdict */}
                <div style={{ borderLeft: `3px solid ${aColor}`, background: 'var(--z1)', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 6px 6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldAlert size={18} style={{ color: aColor }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: aColor }}>
                        {currentEnv.is_safe ? 'SAFE FOR OUTDOOR ACTIVITY' : 'AVOID PROLONGED OUTDOOR EXPOSURE'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>Based on live AQI-US + CPCB thresholds</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: aColor, textAlign: 'right', lineHeight: 1 }}>
                      {formatAqi(currentEnv.aqi_us ?? currentEnv.aqi)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                      AQI-US · {aqiUsCategory(currentEnv.aqi_us ?? currentEnv.aqi)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                      CPCB AQI · {aqiCpcbCategory(currentEnv.aqi_cpcb ?? currentEnv.aqi)}
                    </div>
                  </div>
                </div>

                {/* Metrics row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }} className="max-md:grid-cols-2">
                  {[
                    { icon: <Wind size={14} />, val: formatAqi(currentEnv.aqi_us ?? currentEnv.aqi), unit: 'AQI-US', color: aColor },
                    { icon: <Wind size={14} />, val: formatAqi(currentEnv.aqi_cpcb ?? currentEnv.aqi), unit: 'CPCB AQI', color: 'var(--warn)' },
                    { icon: <Thermometer size={14} />, val: currentEnv.temperature, unit: '°C', color: 'var(--warn)' },
                    { icon: <Droplets size={14} />, val: currentEnv.rainfall, unit: 'mm', color: 'var(--info)' },
                  ].map((m, i) => (
                    <div key={i} style={{ background: 'var(--z3)', border: '1px solid var(--border-subtle)', padding: '12px', textAlign: 'center', borderRadius: 4, borderTop: `2px solid ${m.color}` }}>
                      <div style={{ color: 'var(--ink-3)', marginBottom: 6 }}>{m.icon}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: m.color, lineHeight: 1 }}>{m.val}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>{m.unit}</div>
                    </div>
                  ))}
                </div>

                {/* Briefing */}
                <div style={{ borderLeft: '3px solid var(--border-active)', background: 'var(--z1)', padding: '14px 16px', borderRadius: '0 4px 4px 0' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    AMBIENT SAFETY BRIEFING
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{currentEnv.why}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="max-md:grid-cols-1">
                  <div style={{ background: 'var(--z1)', border: '1px solid var(--border-subtle)', padding: '12px 14px', borderRadius: 4 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>AQI-US</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 600, color: aColor, lineHeight: 1 }}>
                      {formatAqi(currentEnv.aqi_us ?? currentEnv.aqi)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                      Web-style pollution index using the US EPA banding.
                    </div>
                  </div>

                  <div style={{ background: 'var(--z1)', border: '1px solid var(--border-subtle)', padding: '12px 14px', borderRadius: 4 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>CPCB AQI</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 600, color: 'var(--warn)', lineHeight: 1 }}>
                      {formatAqi(currentEnv.aqi_cpcb ?? currentEnv.aqi)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                      Indian CPCB standard used for local policy comparison.
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  Same live station reading, different standards: AQI-US and CPCB AQI use different breakpoints, so they can land in different categories even when the underlying PM values are similar.
                </div>

                {/* Recommendations */}
                <div style={{ background: 'var(--z1)', border: '1px solid var(--border-subtle)', padding: '14px 16px', borderRadius: 4 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    OUTDOOR DIRECTIVES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {currentEnv.recommendations.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ok)', fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
        </div>

        {/* Forecast Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--z2)', border: '1px solid var(--border-default)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--warn)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              MOD.02 // FORECAST-ENGINE
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--ink-1)', marginBottom: 6 }}>
              Pollution Forecasting
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.6 }}>
              7-day historical AQI with linear regression projection for the next 48 hours.
            </p>

            <div style={{ height: 260, border: '1px solid var(--border-subtle)', background: 'var(--z1)', padding: 12, borderRadius: 4, marginBottom: 16 }}>
              {forecastEnv && !loading ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="2 4" />
                    <XAxis dataKey="name" stroke="var(--ink-3)" fontSize={10} fontFamily="var(--font-mono)" tick={{ fill: 'var(--ink-3)' }} />
                    <YAxis stroke="var(--ink-3)" fontSize={10} fontFamily="var(--font-mono)" tick={{ fill: 'var(--ink-3)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--z3)', border: '1px solid var(--border-default)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      labelStyle={{ color: 'var(--ink-2)' }}
                      itemStyle={{ color: 'var(--ink-1)' }}
                    />
                    <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }} />
                    <Line name="Historical AQI" type="monotone" dataKey="Historical" stroke="var(--ok)" strokeWidth={1.5} dot={{ r: 3, fill: 'var(--ok)', strokeWidth: 0 }} connectNulls />
                    <Line name="Model Forecast" type="monotone" dataKey="Forecast" stroke="var(--warn)" strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 3, fill: 'var(--warn)', strokeWidth: 0 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 4 }} />
              )}
            </div>

            {forecastEnv && !loading && (
              <div style={{ borderLeft: '3px solid var(--warn)', background: 'var(--z1)', padding: '14px 16px', borderRadius: '0 4px 4px 0' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  REGRESSION FORECAST BRIEFING
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{forecastEnv.why}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CPCB Reference Table */}
      <div style={{ background: 'var(--z2)', border: '1px solid var(--border-default)', padding: '24px 28px', boxShadow: 'var(--shadow-sm)', borderRadius: 6 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          REF // CPCB INDIA — NATIONAL AQI STANDARDS
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              {['AQI Range', 'Category', 'Health Advisory'].map(h => (
                <th key={h} style={{ padding: '0 16px 10px 0', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CPCB_TABLE.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 100ms' }}
                className="hover:bg-[var(--z3)]"
              >
                <td style={{ padding: '10px 16px 10px 0', fontFamily: 'var(--font-mono)', fontWeight: 600, color: r.col, fontSize: 12 }}>{r.range}</td>
                <td style={{ padding: '10px 16px 10px 0', fontWeight: 600, color: r.col, fontSize: 12 }}>{r.cat}</td>
                <td style={{ padding: '10px 0', color: 'var(--ink-2)', fontSize: 12 }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
