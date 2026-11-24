import React, { useEffect, useState } from 'react';
import { runAgentWorkflow } from '../services/aiAgent';
import {
  STORAGE_KEYS,
  getSetting,
  getAccessToken
} from '../services/localDb';

export default function HeadlessView() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('initializing');
  const [resultData, setResultData] = useState(null);

  const addLog = (msg) => {
    console.log('[HEADLESS]', msg);
    setLogs((prev) => [...prev, `${new Date().toISOString().slice(11, 19)}: ${msg}`]);
  };

  useEffect(() => {
    const runHeadless = async () => {
      addLog('Headless runner mode initiated.');

      const urlParams = new URLSearchParams(window.location.search);
      const task = urlParams.get('task') || 'daily_digest';
      const customPrompt = urlParams.get('prompt') || '';

      addLog(`Task: ${task}`);

      // Verify token
      const token = getAccessToken();
      const apiKey = getSetting(STORAGE_KEYS.AI_API_KEY, '');

      if (!token) {
        setStatus('error');
        const err = 'Error: No valid Google OAuth access_token found in session or profile expired.';
        addLog(err);
        setResultData({ error: err, status: 'unauthorized' });
        return;
      }

      if (!apiKey) {
        setStatus('error');
        const err = 'Error: AI API Key not found in localStorage.';
        addLog(err);
        setResultData({ error: err, status: 'missing_api_key' });
        return;
      }

      // Map task to prompt
      let executionPrompt = customPrompt;
      if (!executionPrompt) {
        if (task === 'daily_digest' || task === 'summarize') {
          executionPrompt = 'Tolong baca semua emel unread terkini. Ringkaskan isu utama, tugasan penting mengikut prioriti, dan sediakan senarai tindakan.';
        } else if (task === 'receipts') {
          executionPrompt = 'Cari semua emel invois atau resit bulan ini dan ringkaskan jumlah perbelanjaan.';
        } else if (task === 'clean') {
          executionPrompt = 'Kenalpasti emel promosi/newsletter unread dan cadangkan arkib.';
        } else {
          executionPrompt = `Laksanakan tugasan emel berikut: ${task}`;
        }
      }

      addLog(`Executing prompt: "${executionPrompt}"`);
      setStatus('running');

      try {
        const result = await runAgentWorkflow({
          userPrompt: executionPrompt,
          history: [],
          onStepUpdate: (step) => {
            addLog(`Step: ${step.message || step.type}`);
          },
          isHeadless: true
        });

        addLog('Agent execution finished successfully.');
        setStatus('completed');

        const outputPayload = {
          status: 'success',
          task,
          completedAt: new Date().toISOString(),
          summary: result.content,
          actionCards: result.actionCards || [],
          logs
        };

        setResultData(outputPayload);

        // Send to Webhook if configured
        const webhookUrl = getSetting(STORAGE_KEYS.WEBHOOK_URL, '');
        if (webhookUrl) {
          addLog(`Dispatching payload to Webhook: ${webhookUrl}`);
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `📬 **malas Automated Daily Digest**\n\n${result.content}`,
                data: outputPayload
              })
            });
            addLog('Webhook dispatched successfully.');
          } catch (webhookErr) {
            addLog(`Webhook dispatch error: ${webhookErr.message}`);
          }
        }

      } catch (err) {
        console.error('Headless error:', err);
        setStatus('error');
        addLog(`Execution error: ${err.message}`);
        setResultData({ error: err.message, status: 'failed' });
      }
    };

    runHeadless();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-mono text-xs">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦥</span>
            <h1 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              malas Headless Automation Runner
            </h1>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
            status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
            status === 'running' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' :
            status === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
            'bg-slate-800 text-slate-400'
          }`}>
            Status: {status}
          </span>
        </div>

        {/* Live log stream */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 max-h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-slate-400">
              {log}
            </div>
          ))}
        </div>

        {/* Scrapeable Output for Puppeteer / Playwright */}
        <div>
          <label className="text-slate-500 text-[10px] uppercase block mb-1">
            DOM Container (#headless-output for CLI Scrapers)
          </label>
          <pre
            id="headless-output"
            className="p-4 bg-slate-900 border border-emerald-500/30 rounded-xl text-emerald-300 whitespace-pre-wrap overflow-x-auto text-xs"
          >
            {resultData ? JSON.stringify(resultData, null, 2) : 'Awaiting completion...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
