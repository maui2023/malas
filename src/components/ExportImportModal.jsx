import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  Trash2,
  AlertOctagon,
  Check,
  Copy,
  FileJson
} from 'lucide-react';
import {
  exportWorkspaceConfig,
  importWorkspaceConfig,
  clearAllLocalData
} from '../services/localDb';

export default function ExportImportModal({ isOpen, onClose, onResetComplete }) {
  if (!isOpen) return null;

  const [jsonInput, setJsonInput] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [copiedExport, setCopiedExport] = useState(false);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);

  const handleDownload = () => {
    const dataStr = exportWorkspaceConfig();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `malas-workspace-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const dataStr = exportWorkspaceConfig();
    navigator.clipboard.writeText(dataStr);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleImport = () => {
    if (!jsonInput.trim()) {
      setImportStatus({ success: false, error: 'Please paste JSON configuration text.' });
      return;
    }

    const res = importWorkspaceConfig(jsonInput.trim());
    if (res.success) {
      setImportStatus({ success: true, message: 'Configuration successfully imported!' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setImportStatus({ success: false, error: res.error });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setJsonInput(text);
      }
    };
    reader.readAsText(file);
  };

  const handlePanicClear = async () => {
    await clearAllLocalData();
    setShowPanicConfirm(false);
    if (onResetComplete) onResetComplete();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 p-6 md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Export & Import Config</h2>
              <p className="text-xs text-slate-400">Replicate settings across browsers or headless CLI runners</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Section */}
        <div className="mt-6 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            Export Workspace Config
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Exports OAuth Client ID, AI provider, models, and prompts into portable JSON (tokens are excluded).
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download .json
            </button>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1.5 transition"
            >
              {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedExport ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="mt-6 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            Import Workspace Config
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Paste configuration JSON or choose a file from your computer.
          </p>

          <div className="mt-3">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
            />
          </div>

          <textarea
            rows={4}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Paste JSON workspace config here...'
            className="w-full mt-3 p-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-slate-200 outline-none"
          />

          {importStatus && (
            <div className={`mt-2 p-2 rounded-lg text-xs ${
              importStatus.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {importStatus.success ? importStatus.message : importStatus.error}
            </div>
          )}

          <button
            onClick={handleImport}
            className="mt-3 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition"
          >
            Apply Configuration
          </button>
        </div>

        {/* Panic Button Section */}
        <div className="mt-6 p-4 rounded-xl border border-rose-950/50 bg-rose-950/10">
          <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            Panic Button: Clear All Local Data
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Instantly clears IndexedDB email cache, chat history, drafts, API keys, and OAuth sessions stored in this browser.
          </p>

          {showPanicConfirm ? (
            <div className="mt-3 p-3 bg-rose-900/30 border border-rose-500/30 rounded-xl space-y-2">
              <p className="text-xs text-rose-200 flex items-center gap-1.5 font-semibold">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                Are you sure? This action is permanent and cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePanicClear}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition"
                >
                  Yes, Wipe Everything
                </button>
                <button
                  onClick={() => setShowPanicConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPanicConfirm(true)}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Wipe All Local Data
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
