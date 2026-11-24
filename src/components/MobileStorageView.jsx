import React, { useState, useEffect } from 'react';
import {
  Database,
  Mail,
  ShieldCheck,
  FileJson,
  Trash2,
  ExternalLink,
  HardDrive
} from 'lucide-react';
import { db } from '../services/localDb';

export default function MobileStorageView({ onOpenExportImport, onNewChat }) {
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
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto px-4 py-5 pb-24 text-slate-100">
      
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <HardDrive className="w-5 h-5 text-emerald-400" />
        <h2 className="text-base font-bold text-white">Local-First Storage & Data</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Cached Emails</span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {cachedEmailsCount}
          </div>
          <p className="text-[10px] text-slate-500">Dalam IndexedDB pelayar</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Mail className="w-4 h-4 text-teal-400" />
            <span>Local Drafts</span>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {draftsCount}
          </div>
          <p className="text-[10px] text-slate-500">Draf belum dihantar</p>
        </div>

      </div>

      {/* Security & Privacy Card */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 mb-4 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Local-First Architecture</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Semua emel, draf mesej, dan kunci API anda disimpan secara eksklusif di dalam memori pelayar anda (IndexedDB / LocalStorage). <strong>Tiada pelayan pihak ketiga atau pangkalan data luar</strong> yang menyimpan data sulit anda.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2.5 mb-5">
        <button
          onClick={onOpenExportImport}
          className="w-full p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-between transition active:scale-98"
        >
          <span className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-emerald-400" />
            Eksport / Import Konfigurasi
          </span>
          <span className="text-slate-500">&rarr;</span>
        </button>

        <button
          onClick={onNewChat}
          className="w-full p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center justify-between transition active:scale-98"
        >
          <span className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            Kosongkan Sesi Chat Semasa
          </span>
          <span className="text-slate-500">&rarr;</span>
        </button>
      </div>

      {/* Hosted link */}
      <div className="mt-auto pt-4 border-t border-slate-800/80 text-center">
        <a
          href="https://maui2023.github.io/malas"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1.5"
        >
          <span>maui2023.github.io/malas</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <p className="text-[10px] text-slate-500 mt-1">OpenWork Lite &bull; Client-Side Agent</p>
      </div>

    </div>
  );
}
