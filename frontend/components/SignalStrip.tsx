"use client";
import React, { useState, useEffect } from 'react';
import { getCurrentEnv, getCommunityTrend } from '../lib/api';

type Status = 'ok' | 'warn' | 'alert';

interface StripItem {
  text: string;
  status: Status;
}

function statusColor(s: Status) {
  if (s === 'ok')    return 'var(--ok)';
  if (s === 'warn')  return 'var(--warn)';
  return 'var(--alert)';
}

export default function SignalStrip() {
  const [items, setItems] = useState<StripItem[]>([
    { text: "PATNA · CONNECTING", status: 'warn' },
    { text: "DELHI · CONNECTING", status: 'warn' },
    { text: "MUMBAI · CONNECTING", status: 'warn' },
    { text: "BENGALURU · CONNECTING", status: 'warn' },
    { text: "WARD-03 · LOADING", status: 'warn' },
  ]);

  useEffect(() => {
    async function fetchStripData() {
      const cities = ["Patna", "Delhi", "Mumbai", "Bengaluru"];
      const cityItems = await Promise.all(
        cities.map(async (city) => {
          try {
            const res = await getCurrentEnv(city);
            let status: Status = 'ok';
            if (res.aqi > 100) status = 'warn';
            if (res.aqi > 200) status = 'alert';
            return {
              text: `${city.toUpperCase()} · AQI ${Math.round(res.aqi)} · ${res.category.toUpperCase()} · ${res.temperature}°C`,
              status
            };
          } catch {
            return { text: `${city.toUpperCase()} · OFFLINE`, status: 'warn' as Status };
          }
        })
      );

      let wardItem: StripItem = { text: "WARD-03 · LOADING RISK DATA", status: 'warn' };
      try {
        const res = await getCommunityTrend("Ward 3");
        let status: Status = 'ok';
        if (res.predicted_risk.toLowerCase() === 'medium') status = 'warn';
        if (res.predicted_risk.toLowerCase() === 'high') status = 'alert';
        wardItem = { text: `WARD-03 · DENGUE · ${res.predicted_risk.toUpperCase()} RISK`, status };
      } catch {}

      const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setItems([
        ...cityItems,
        wardItem,
        { text: `LAST SYNC · ${timestamp} IST`, status: 'ok' },
      ]);
    }

    fetchStripData();
    const interval = setInterval(fetchStripData, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--z1)',
        overflow: 'hidden',
        userSelect: 'none',
        height: 30,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Left — Fixed label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 14px',
          borderRight: '1px solid var(--border-subtle)',
          flexShrink: 0,
          height: '100%',
        }}
      >
        <span
          style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'var(--ok)',
            animation: 'pulse-ok 2.5s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--ink-3)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          LIVE
        </span>
      </div>

      {/* Ticker scroll */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            gap: 48,
            whiteSpace: 'nowrap',
            animation: 'ticker 35s linear infinite',
            willChange: 'transform',
          }}
        >
          {[...items, ...items].map((item, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ink-2)',
                letterSpacing: '0.06em',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: statusColor(item.status),
                  flexShrink: 0,
                }}
              />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
