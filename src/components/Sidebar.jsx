import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Mail,
  Reply,
  Receipt,
  Trash,
  Calendar,
  Database,
  ShieldCheck,
  Plus,
  Zap,
  ExternalLink
} from 'lucide-react';
import { db } from '../services/localDb';

export const WORKFLOW_PRESETS = [
  {
    id: 'unread_summary',
    icon: Zap,
    label: 'Summarize Unread Emails',
    description: 'Triage unread emails today & extract urgent tasks',
    prompt: 'Tolong baca dan ringkaskan semua emel unread terkini. Kelaskan ikut prioriti (🔥 Urgent, 📌 Needs Reply, ℹ️ FYI) dan senaraikan tindakan yang perlu diambil.'
  },
  {
    id: 'draft_replies',
    icon: Reply,
    label: 'Draft Replies (Last 24h)',
    description: 'Polite draft replies for unanswered emails',
    prompt: 'Semak emel penting dari 24 jam lepas yang belum dibalas, dan sediakan draf jawapan yang sopan dan profesional untuk setiap satu.'
  },
  {
    id: 'receipts_invoices',
    icon: Receipt,
    label: 'Find Invoices & Receipts',
    description: 'Aggregate monthly receipts & totals',
    prompt: 'Cari semua emel resit, invois atau bayaran bulan ini (query: invoice OR receipt OR payment) dan buat ringkasan jumlah yang dibelanjakan.'
  },
  {
    id: 'clean_promos',
    icon: Trash,
    label: 'Clean & Archive Promotions',
    description: 'Find promotional emails & propose archive',
    prompt: 'Cari emel promosi/newsletter yang belum dibaca (category:promotions is:unread) dan cadangkan untuk archive supaya inbox bersih.'
  },
];

export default function Sidebar({ onSelectPrompt, onNewChat }) {
  const [cachedEmailsCount, setCachedEmailsCount] = useState(0);
  const [draftsCount, setDraftsCount] = useState(0);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const emails = await db.email_cache.count();
        const drafts = await db.drafts.count();
        setCachedEmailsCount(emails);
        setDraftsCount(drafts);
      } catch (e) {
        console.warn('Could not read db stats:', e);
      }
    };
    updateStats();
    const interval = setInterval(updateStats, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 bg-slate-950 border-r border-slate-800/80 shrink-0 h-full overflow-y-auto">
      
      {/* Top action: New Session */}
      <div className="p-4 space-y-4">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>New Chat Session</span>
        </button>

        {/* Quick Workflows Section */}
        <div>
          <div className="px-1 pb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Workflows</span>
          </div>
          
          <div className="space-y-1.5">
            {WORKFLOW_PRESETS.map((wf) => {
              const Icon = wf.icon;
              return (
                <button
                  key={wf.id}
                  onClick={() => onSelectPrompt(wf.prompt)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/50 hover:border-slate-700 transition group flex items-start gap-2.5"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition">
                      {wf.label}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {wf.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Storage & Privacy Info */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/60">
        
        {/* Local Storage Stats */}
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Cached Emails
            </span>
            <span className="font-mono font-bold text-slate-200">{cachedEmailsCount}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Local Drafts
            </span>
            <span className="font-mono font-bold text-slate-200">{draftsCount}</span>
          </div>
        </div>

        {/* Security / Privacy badge */}
        <div className="flex items-start gap-2 p-2 text-[11px] text-slate-400 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>100% Local-First</strong>. Zero backend servers. Your emails and keys stay exclusively in your browser.
          </span>
        </div>

        {/* Hosted Link */}
        <a
          href="https://maui2023.github.io/malas"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-emerald-400 hover:underline flex items-center justify-center gap-1"
        >
          maui2023.github.io/malas <ExternalLink className="w-3 h-3" />
        </a>

      </div>

    </aside>
  );
}
