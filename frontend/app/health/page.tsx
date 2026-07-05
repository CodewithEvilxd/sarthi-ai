"use client";
import React, { useState, useEffect } from 'react';
import { FileText, Activity, ShieldAlert, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { analyzeReport, getCommunityTrend, HealthReportResponse, HealthCommunityResponse } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const WARDS = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];

function riskColor(r: string): string {
  switch (r.toLowerCase()) {
    case 'high': return 'var(--alert)';
    case 'medium': return 'var(--warn)';
    default: return 'var(--ok)';
  }
}

export default function HealthPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportResult, setReportResult] = useState<HealthReportResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selectedWard, setSelectedWard] = useState("Ward 3");
  const [healthTrend, setHealthTrend] = useState<HealthCommunityResponse | null>(null);
  const [loadingTrend, setLoadingTrend] = useState(false);

  useEffect(() => {
    async function loadTrend() {
      setLoadingTrend(true);
      try { setHealthTrend(await getCommunityTrend(selectedWard)); }
      catch (err) { console.error(err); }
      finally { setLoadingTrend(false); }
    }
    loadTrend();
  }, [selectedWard]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setAnalyzing(true);
    setUploadError(null);
    setReportResult(null);
    try { setReportResult(await analyzeReport(file)); }
    catch (err: any) { setUploadError(err.message || "Analysis failed. Please verify file format."); }
    finally { setAnalyzing(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink-1)', margin: 0 }}>
          Clinical & Community Health Diagnostics
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
          Vision-based clinical report parsing · Ward-level disease surveillance · ICMR/WHO guideline matching
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }} className="max-lg:grid-cols-1">
        {/* Left: Report Parser */}
        <div style={{ background: 'var(--z2)', border: '1px solid var(--border-default)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--info)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              MOD.01 // CLINICAL-VISION-PARSER
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--ink-1)', margin: 0 }}>
              Prescription & Report Analysis
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.6 }}>
              Upload lab reports or prescriptions. Sarthi Vision extracts vitals and flags anomalies against WHO/ICMR references.
            </p>
          </div>

          {/* Upload zone */}
          <div
            style={{
              position: 'relative',
              border: `2px dashed var(--border-default)`,
              padding: '32px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              transition: 'border-color 150ms, background 150ms',
              borderRadius: 6,
              background: 'var(--z1)',
              marginBottom: 20,
            }}
            className="hover:border-[var(--border-active)] hover:bg-[var(--z2)]"
          >
            <input
              type="file" accept="image/*"
              onChange={handleFileUpload}
              disabled={analyzing}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: analyzing ? 'not-allowed' : 'pointer' }}
            />
            {analyzing
              ? <RefreshCw size={28} style={{ color: 'var(--ok)', marginBottom: 10, animation: 'spin 1s linear infinite' }} />
              : <Upload size={28} style={{ color: 'var(--ink-3)', marginBottom: 10 }} />
            }
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-1)' }}>
              {selectedFile ? selectedFile.name : 'Upload Report Image'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              {analyzing ? 'Analyzing with Gemini Vision...' : 'JPEG or PNG · Up to 10MB'}
            </div>
          </div>

          {uploadError && (
            <div style={{ borderLeft: '3px solid var(--alert)', background: 'var(--z1)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--alert)', marginBottom: 16, borderRadius: '0 4px 4px 0' }}>
              <AlertCircle size={14} /> {uploadError}
            </div>
          )}

          {analyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[80, 60, 40].map((w, i) => <div key={i} className="skeleton" style={{ height: 16, borderRadius: 4, width: `${w}%` }} />)}
            </div>
          )}

          {reportResult && !analyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'slideUp 200ms ease-out' }}>
              {/* Extracted metrics */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  EXTRACTED CLINICAL TELEMETRY
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {Object.entries(reportResult.extracted_values).map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--z3)', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--data)' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderLeft: '3px solid var(--info)', background: 'var(--z1)', padding: '14px 16px', borderRadius: '0 4px 4px 0' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--info)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>PLAIN-LANGUAGE EXPLANATION</div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink-1)', margin: 0 }}>{reportResult.explanation}</p>
              </div>

              <div style={{ borderLeft: '3px solid var(--border-active)', background: 'var(--z1)', padding: '14px 16px', borderRadius: '0 4px 4px 0' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>EXPLAINABLE AI — WHY?</div>
                <p style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{reportResult.why}</p>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>GUIDELINES MATCHED (RAG)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {reportResult.guidelines_used.map((g, i) => (
                    <span key={i} style={{ fontSize: 11, color: 'var(--ok)', border: '1px solid rgba(82,196,168,0.3)', padding: '3px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={10} /> {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Ward Surveillance */}
        <div style={{ background: 'var(--z2)', border: '1px solid var(--border-default)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ok)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                MOD.01 // EPID-SURVEILLANCE
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--ink-1)', margin: 0 }}>
                Ward Surveillance Trends
              </h2>
            </div>
            <select
              value={selectedWard}
              onChange={e => setSelectedWard(e.target.value)}
              style={{
                background: 'var(--z3)', border: '1px solid var(--border-active)',
                color: 'var(--ink-1)', fontSize: 12, fontWeight: 600,
                padding: '5px 10px', outline: 'none', cursor: 'pointer', borderRadius: 4,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.6 }}>
            Weekly dengue/fever case counts vs rainfall correlation — identifies vector breeding windows.
          </p>

          <div style={{ height: 240, border: '1px solid var(--border-subtle)', background: 'var(--z1)', padding: 12, marginBottom: 20, borderRadius: 4 }}>
            {healthTrend && !loadingTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthTrend.historical_trends} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="2 4" />
                  <XAxis dataKey="week" stroke="var(--ink-3)" fontSize={10} fontFamily="var(--font-mono)" tick={{ fill: 'var(--ink-3)' }} />
                  <YAxis stroke="var(--ink-3)" fontSize={10} fontFamily="var(--font-mono)" tick={{ fill: 'var(--ink-3)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--z3)', border: '1px solid var(--border-default)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}
                    labelStyle={{ color: 'var(--ink-2)' }}
                    itemStyle={{ color: 'var(--ink-1)' }}
                  />
                  <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }} />
                  <Bar name="Dengue Cases" dataKey="cases" fill="var(--ok)" radius={[3, 3, 0, 0]} />
                  <Bar name="Rainfall (mm)" dataKey="rainfall_mm" fill="var(--info)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 4 }} />
            )}
          </div>

          {healthTrend && (() => {
            const rc = riskColor(healthTrend.predicted_risk);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ borderLeft: `3px solid ${rc}`, background: 'var(--z1)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 4px 4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={14} style={{ color: rc }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: rc }}>Outbreak Risk Assessment</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: rc, border: `1px solid ${rc}`, padding: '2px 8px', borderRadius: 3, opacity: 0.85 }}>
                    {healthTrend.predicted_risk.toUpperCase()}
                  </span>
                </div>

                <div style={{ borderLeft: '3px solid var(--border-default)', background: 'var(--z1)', padding: '14px 16px', borderRadius: '0 4px 4px 0' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>SURVEILLANCE REASONING</div>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{healthTrend.why}</p>
                </div>

                <div style={{ background: 'var(--z1)', border: '1px solid var(--border-subtle)', padding: '14px 16px', borderRadius: 4 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>PREVENTATIVE DIRECTIVES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {healthTrend.recommendations.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ok)', fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
