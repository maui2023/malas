import React from 'react';
import { Sparkles, Plus, ArrowRight } from 'lucide-react';
import { WORKFLOW_PRESETS } from './Sidebar';

export default function MobileWorkflows({ onSelectPrompt, onNewChat }) {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto px-4 py-5 pb-24 text-slate-100">
      
      {/* Top Banner / New Session Card */}
      <div className="mb-5">
        <button
          onClick={onNewChat}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/20 active:scale-98 transition"
        >
          <Plus className="w-5 h-5 text-white" />
          <span>New Chat Session</span>
        </button>
      </div>

      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span>Quick Workflows Gmail</span>
      </div>

      {/* Workflows List */}
      <div className="space-y-3">
        {WORKFLOW_PRESETS.map((wf) => {
          const Icon = wf.icon;
          return (
            <button
              key={wf.id}
              onClick={() => onSelectPrompt(wf.prompt)}
              className="w-full text-left p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 transition active:scale-[0.99] group shadow-sm flex items-start gap-3.5"
            >
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition shrink-0 mt-0.5 border border-emerald-500/20">
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition truncate">
                    {wf.label}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  {wf.description}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400/90">
                  <span>Jalankan Workflow</span>
                  <span>&rarr;</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
