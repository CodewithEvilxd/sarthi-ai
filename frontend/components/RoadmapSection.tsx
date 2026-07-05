import React from 'react';

export default function RoadmapSection() {
  const phases = [
    {
      code: 'PHASE-02 // PENDING',
      title: 'Citizen Services Agent',
      desc: 'Automates civil certificates, municipal registry requests, and land record processing.',
    },
    {
      code: 'PHASE-03 // PENDING',
      title: 'Public Safety Agent',
      desc: 'Orchestrates real-time fire alarms, flood evacuations, and traffic bottleneck interventions.',
    },
    {
      code: 'PHASE-04 // PENDING',
      title: 'Education & Awareness Agent',
      desc: 'Coordinates school health alerts, tracks infection-related attendance drops, and distributes curriculums.',
    }
  ];

  return (
    <div className="py-12 border-t border-[var(--hairline)] mt-4">
      <div className="text-left mb-10">
        <span className="text-xs text-[var(--signal-teal)] font-mono font-medium uppercase tracking-widest bg-[var(--bg-panel)] border border-[var(--hairline)] px-3 py-1">
          PLATFORM VISION // PHASE 02-04
        </span>
        <h2 className="text-2xl font-display font-semibold text-[var(--ink-primary)] mt-4">Multi-Agent Expansion Roadmap</h2>
        <p className="text-[var(--ink-muted)] text-xs mt-2 max-w-xl leading-relaxed">
          Health and Environment domains are fully operational. The following public service domains are scheduled for integration.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
        {phases.map((phase, idx) => (
          <div
            key={idx}
            className="bg-[var(--bg-panel)] border border-dashed border-[var(--hairline)] p-6 hover:bg-[var(--bg-panel-raised)] transition-colors"
          >
            <span className="text-[10px] font-mono text-[var(--signal-amber)] uppercase tracking-widest block mb-4">
              {phase.code}
            </span>

            <h3 className="font-display font-semibold text-[var(--ink-primary)] text-base">
              {phase.title}
            </h3>
            
            <p className="text-[var(--ink-muted)] text-xs mt-2 leading-relaxed">
              {phase.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
