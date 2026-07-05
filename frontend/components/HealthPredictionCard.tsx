import React from 'react';
import { Activity } from 'lucide-react';

interface Props {
  ward: string;
  predictedRisk: string;
  recommendations: string[];
  why: string;
}

function riskColor(r: string): string {
  switch (r.toLowerCase()) {
    case 'high': return 'var(--alert)';
    case 'medium': return 'var(--warn)';
    default: return 'var(--ok)';
  }
}

export default function HealthPredictionCard({ ward, predictedRisk, recommendations, why }: Props) {
  const rc = riskColor(predictedRisk);

  return (
    <div
      style={{
        background: 'var(--z2)',
        border: '1px solid var(--border-default)',
        borderTop: `3px solid ${rc}`,
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        animation: 'slideUp 200ms ease-out',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: rc }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--ink-1)' }}>
            {ward} Health Status
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
            color: rc, border: `1px solid ${rc}`, padding: '3px 8px', borderRadius: 3,
            opacity: 0.85,
          }}
        >
          {predictedRisk.toUpperCase()} RISK
        </span>
      </div>

      {/* Why briefing */}
      <div style={{ borderLeft: `3px solid ${rc}`, background: 'var(--z1)', padding: '14px 16px', borderRadius: '0 4px 4px 0' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          EPIDEMIOLOGY BRIEFING — {ward.replace(' ', '-').toUpperCase()}
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>{why}</p>
      </div>

      {/* Recommendations */}
      <div style={{ background: 'var(--z1)', border: '1px solid var(--border-subtle)', padding: '14px 16px', borderRadius: 4 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          RECOMMENDED CIVIC ACTIONS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recommendations.map((rec, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ok)', fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
