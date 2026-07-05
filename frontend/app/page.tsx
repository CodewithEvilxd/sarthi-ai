"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentEnv } from '../lib/api';

const CITY_COORDS: Record<string, { label: string; lat: number }> = {
  "Patna":     { label: "PNQ", lat: 25.59 },
  "Delhi":     { label: "DEL", lat: 28.70 },
  "Mumbai":    { label: "BOM", lat: 19.07 },
  "Bengaluru": { label: "BLR", lat: 12.97 },
};

function aqiColor(aqi: number): string {
  if (aqi <= 100) return 'var(--ok)';
  if (aqi <= 200) return 'var(--warn)';
  return 'var(--alert)';
}

function aqiLabel(aqi: number): string {
  if (aqi <= 50)  return 'GOOD';
  if (aqi <= 100) return 'SAT.';
  if (aqi <= 200) return 'MOD.';
  if (aqi <= 300) return 'POOR';
  return 'CRIT.';
}

interface CityData {
  city: string;
  aqi: number;
  temperature: number;
  category: string;
}

// Live animated terminal for the hero
function TerminalWindow() {
  const lines = [
    { delay: 0,    text: '> classify_intent("Air quality in Delhi today?")',     color: 'var(--ink-2)' },
    { delay: 600,  text: '  ← INTENT: environment.aqi_query [PATNA]',            color: 'var(--ok)' },
    { delay: 1200, text: '> env_agent.fetch_live(city="Delhi")',                  color: 'var(--ink-2)' },
    { delay: 1800, text: '  ← openaq.v3 PM2.5: 118 µg/m³  ✓',                   color: 'var(--ok)' },
    { delay: 2400, text: '> rag.query("CPCB AQI guidelines")',                    color: 'var(--ink-2)' },
    { delay: 3000, text: '  ← Retrieved 3 docs (0.18s)',                          color: 'var(--info)' },
    { delay: 3600, text: '> generate_answer(context, query)',                     color: 'var(--ink-2)' },
    { delay: 4200, text: '  ← AQI 247 — POOR. Avoid prolonged outdoor activity.', color: 'var(--warn)' },
  ];

  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    lines.forEach((line, idx) => {
      setTimeout(() => {
        setVisible(prev => [...prev, idx]);
      }, line.delay);
    });
    // Restart loop
    const restart = setInterval(() => {
      setVisible([]);
      lines.forEach((line, idx) => {
        setTimeout(() => {
          setVisible(prev => [...prev, idx]);
        }, line.delay);
      });
    }, 6000);
    return () => clearInterval(restart);
  }, []);

  return (
    <div
      style={{
        background: 'var(--z2)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--z1)',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--alert)' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--warn)' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ok)' }} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-3)',
            marginLeft: 8,
            letterSpacing: '0.06em'
          }}
        >
          sarthi-agent — chief-decision-agent
        </span>
      </div>

      {/* Terminal body */}
      <div style={{ padding: '16px 20px', minHeight: 220, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        {lines.map((line, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 4,
              opacity: visible.includes(idx) ? 1 : 0,
              transform: visible.includes(idx) ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 200ms ease-out, transform 200ms ease-out',
              color: line.color,
              whiteSpace: 'pre',
            }}
          >
            {line.text}
          </div>
        ))}
        {/* Blinking cursor */}
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 14,
            background: 'var(--ok)',
            marginTop: 4,
            animation: 'pulse-ok 1s steps(1) infinite',
          }}
        />
      </div>
    </div>
  );
}

// Feature cards — honest, evidence-based
const FEATURES = [
  {
    code: 'MOD.01',
    title: 'Clinical Report Parser',
    detail: 'Vision AI reads prescriptions and lab images. Extracts vitals. Flags anomalies against WHO/ICMR references.',
    metric: '< 3s',
    metricLabel: 'avg. analysis time',
    color: 'var(--info)',
  },
  {
    code: 'MOD.02',
    title: 'Live Air Quality Intel',
    detail: 'Real PM2.5 from OpenAQ v3. 7-day AQI trend. 48-hour ML forecast. CPCB guideline alignment per reading.',
    metric: '4 cities',
    metricLabel: 'monitored live',
    color: 'var(--ok)',
  },
  {
    code: 'MOD.03',
    title: 'Disease Surveillance',
    detail: 'Per-ward dengue/fever trend tracking. Rainfall correlation analysis. Epidemic risk prediction with plain-language briefings.',
    metric: '5 wards',
    metricLabel: 'epidemiology coverage',
    color: 'var(--warn)',
  },
  {
    code: 'MOD.04',
    title: 'Civic Grievance Router',
    detail: 'Citizens describe complaints in natural language. AI classifies category, severity, and routes to the correct department.',
    metric: 'AI-routed',
    metricLabel: 'no manual triage',
    color: 'var(--alert)',
  },
];

const ARCHITECTURE_STEPS = [
  { id: '01', label: 'Citizen Input', sub: 'Text / Image / Voice' },
  { id: '02', label: 'Chief Agent', sub: 'Intent → Route' },
  { id: '03', label: 'Domain Agents', sub: 'Health · Env · Civic' },
  { id: '04', label: 'RAG + APIs', sub: 'CPCB · OpenAQ · ICMR' },
  { id: '05', label: 'Explainable Output', sub: 'Answer + Why + Sources' },
];

export default function LandingPage() {
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    async function fetchCities() {
      try {
        const results = await Promise.allSettled(
          Object.keys(CITY_COORDS).map(async (city) => {
            const r = await getCurrentEnv(city);
            return { city, aqi: r.aqi, temperature: r.temperature, category: r.category };
          })
        );
        setCityData(
          results
            .filter((r): r is PromiseFulfilledResult<CityData> => r.status === 'fulfilled')
            .map(r => r.value)
        );
      } catch {}
      finally { setLoadingCities(false); }
    }
    fetchCities();
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO SECTION
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: 48,
          alignItems: 'start',
          paddingTop: 48,
          paddingBottom: 64,
        }}
        className="max-lg:grid-cols-1"
      >
        {/* Left — Typography lockup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--ok)',
                animation: 'pulse-ok 2.5s ease-in-out infinite',
                display: 'inline-block', flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ok)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase'
              }}
            >
              LIVE · 4 CITIES · MULTI-AGENT AI
            </span>
          </div>

          {/* Headline — dominant, no gradient */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5.5vw, 58px)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: 'var(--ink-1)',
              margin: 0,
            }}
          >
            One AI.
            <br />
            Every civic
            <br />
            <span style={{ color: 'var(--ok)' }}>decision.</span>
          </h1>

          {/* Subhead */}
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.65,
              color: 'var(--ink-2)',
              maxWidth: 460,
              margin: 0,
            }}
          >
            Sarthi AI monitors air quality, predicts disease outbreaks, parses clinical reports,
            and routes civic complaints — all with explainable AI reasoning grounded in real government guidelines.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <Link
              href="/dashboard"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}
            >
              Open Dashboard
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7 }}>→</span>
            </Link>
            <Link
              href="/chat"
              className="btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 6, textDecoration: 'none' }}
            >
              Ask Sarthi
            </Link>
          </div>

          {/* Trust signals */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 16,
              paddingTop: 20,
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            {[
              { val: 'CPCB', sub: 'Guidelines Used' },
              { val: 'OpenAQ v3', sub: 'Live AQI Feed' },
              { val: 'WHO/ICMR', sub: 'Clinical References' },
            ].map(t => (
              <div key={t.val}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--ink-1)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {t.val}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Live Terminal */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-3)',
              letterSpacing: '0.08em',
              marginBottom: 10,
              textTransform: 'uppercase'
            }}
          >
            LIVE AGENT TRACE — SAMPLE QUERY
          </div>
          <TerminalWindow />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          LIVE CITY DATA STRIP
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          background: 'var(--z2)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '20px 28px',
          marginBottom: 64,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-3)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          LIVE TELEMETRY — ACTIVE STATIONS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}
          className="max-md:grid-cols-2"
        >
          {loadingCities
            ? Object.keys(CITY_COORDS).map(city => (
                <div key={city}
                  className="skeleton"
                  style={{ height: 72, borderRadius: 4 }}
                />
              ))
            : cityData.map((c) => {
                const code = CITY_COORDS[c.city]?.label ?? c.city.toUpperCase().substring(0, 3);
                const col = aqiColor(c.aqi);
                return (
                  <Link
                    key={c.city}
                    href="/dashboard"
                    style={{
                      display: 'block',
                      padding: '12px 0',
                      textDecoration: 'none',
                      borderTop: `2px solid ${col}`,
                      paddingTop: 14,
                      transition: 'opacity 150ms',
                    }}
                    className="hover:opacity-80"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                        {code}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          color: col,
                          letterSpacing: '0.1em',
                          border: `1px solid ${col}`,
                          padding: '1px 5px',
                          borderRadius: 2
                        }}
                      >
                        {aqiLabel(c.aqi)}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 500, color: col, lineHeight: 1 }}>
                      {Math.round(c.aqi)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                      {c.city} · {c.temperature}°C
                    </div>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FEATURES GRID
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ marginBottom: 64 }}>
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--ink-1)',
              margin: 0,
            }}
          >
            Four intelligence modules
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, marginTop: 8 }}>
            Each powered by a dedicated AI agent with RAG grounding and explainable decision trails.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--border-default)',
          }}
          className="max-md:grid-cols-1"
        >
          {FEATURES.map((f, idx) => (
            <div
              key={f.code}
              style={{
                background: 'var(--z2)',
                padding: '28px 32px',
                borderBottom: idx < FEATURES.length - 2 ? '1px solid var(--border-subtle)' : undefined,
                borderRight: idx % 2 === 0 ? '1px solid var(--border-subtle)' : undefined,
                transition: 'background 150ms',
                cursor: 'default',
              }}
              className="hover:bg-[var(--z3)]"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: f.color,
                    letterSpacing: '0.1em',
                  }}
                >
                  {f.code}
                </span>
                {/* Metric badge */}
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 16,
                      fontWeight: 500,
                      color: f.color,
                    }}
                  >
                    {f.metric}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{f.metricLabel}</div>
                </div>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 19,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--ink-1)',
                  margin: '0 0 10px 0',
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
                {f.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ARCHITECTURE FLOW
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        style={{
          background: 'var(--z2)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '36px 40px',
          marginBottom: 64,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-3)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 28,
          }}
        >
          ARCHITECTURE // MULTI-AGENT DECISION PIPELINE
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            overflowX: 'auto',
          }}
        >
          {ARCHITECTURE_STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 120,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    background: 'var(--z3)',
                    border: '1px solid var(--border-active)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--ok)',
                  }}
                >
                  {step.id}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)' }}>{step.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{step.sub}</div>
                </div>
              </div>

              {idx < ARCHITECTURE_STEPS.length - 1 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      height: 1,
                      flex: 1,
                      background: `linear-gradient(to right, var(--border-active), var(--border-subtle))`,
                    }}
                  />
                  <span style={{ color: 'var(--ok)', fontSize: 12, margin: '0 4px', flexShrink: 0 }}>›</span>
                  <div
                    style={{
                      height: 1,
                      flex: 1,
                      background: `linear-gradient(to right, var(--border-subtle), var(--border-active))`,
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ROADMAP
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ marginBottom: 80 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.015em',
            color: 'var(--ink-1)',
            marginBottom: 20,
          }}
        >
          Platform Roadmap
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
          className="max-md:grid-cols-1"
        >
          {[
            { phase: '02', title: 'Citizen Services', detail: 'Automates civil certificates, municipal registry requests, and land record processing.', status: 'Planned Q3 2026' },
            { phase: '03', title: 'Public Safety Agent', detail: 'Real-time flood evacuation coordination, fire alert management, traffic crisis interventions.', status: 'Planned Q4 2026' },
            { phase: '04', title: 'Education & Awareness', detail: 'School health alerts, infection-related attendance tracking, curriculum delivery.', status: 'Planned Q1 2027' },
          ].map(r => (
            <div
              key={r.phase}
              style={{
                background: 'var(--z2)',
                border: '1px dashed var(--border-default)',
                borderRadius: 8,
                padding: '24px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--warn)',
                  letterSpacing: '0.1em',
                  marginBottom: 10,
                }}
              >
                PHASE-{r.phase} <span style={{ color: 'var(--ink-3)' }}>{"// PENDING"}</span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--ink-1)',
                  margin: '0 0 8px 0',
                }}
              >
                {r.title}
              </h3>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 14px 0' }}>{r.detail}</p>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{r.status}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
