import React from 'react';
import { Network, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export interface TraceItem {
  agent_name: string;
  reason: string;
  decision: string;
}

interface AgentTraceViewProps {
  trace: TraceItem[];
  sources: string[];
}

export default function AgentTraceView({ trace, sources }: AgentTraceViewProps) {
  return (
    <div className="mt-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 text-sm shadow-inner">
      <div className="flex items-center gap-2 mb-4 text-cyan-400 font-semibold uppercase tracking-wider text-xs">
        <Network size={16} />
        <span>Explainable AI — Multi-Agent Routing Trail</span>
      </div>

      <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-5">
        {trace.map((item, idx) => (
          <div key={idx} className="relative">
            {/* Timeline Circle */}
            <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-cyan-500 shadow-sm shadow-cyan-500/50">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </span>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold text-sm">
                <span>{item.agent_name}</span>
                <ChevronRight size={12} className="text-slate-500" />
                <span className="text-xs font-normal text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900/30">
                  Active
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                <span className="text-slate-500 font-medium">Trigger Context:</span> {item.reason}
              </p>
              <p className="text-slate-300 text-xs mt-1 bg-slate-950/40 p-2 rounded border border-slate-800/40 leading-relaxed">
                <span className="text-cyan-400 font-semibold">Decision Output:</span> {item.decision}
              </p>
            </div>
          </div>
        ))}
      </div>

      {sources && sources.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-850">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-xs mb-2">
            <FileText size={14} className="text-cyan-500" />
            <span>Document Sources Consulted (RAG)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sources.map((src, idx) => (
              <span 
                key={idx} 
                className="text-xs bg-slate-950 text-slate-300 px-3 py-1 rounded-md border border-slate-800 flex items-center gap-1"
              >
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>{src}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
