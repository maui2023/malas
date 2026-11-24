import React, { useState } from 'react';
import { Send, FileText, CheckCircle2, AlertCircle, Edit3, Loader2 } from 'lucide-react';
import * as gmail from '../services/gmailApi';

export default function ActionCard({ card, onEdit }) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleApproveSend = async () => {
    setIsSending(true);
    setError(null);
    try {
      await gmail.send_email({
        to: card.to,
        subject: card.subject,
        body: card.body,
        threadId: card.threadId || null,
        draftId: card.draftId || null
      });
      setIsSent(true);
      setShowConfirm(false);
    } catch (err) {
      console.error('Send email failed:', err);
      setError(err.message || 'Failed to send email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="my-3 p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl overflow-hidden text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <FileText className="w-4 h-4" />
          <span>
            {isSent ? 'Email Sent Successfully' : card.type === 'CONFIRM_SEND' ? 'Action Required: Approve & Send' : 'Draft Prepared in Gmail'}
          </span>
        </div>
        {card.draftId && (
          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
            Draft ID: {card.draftId}
          </span>
        )}
      </div>

      {/* Email Metadata */}
      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-baseline gap-2">
          <span className="text-slate-400 font-semibold w-12 shrink-0">To:</span>
          <span className="font-mono text-emerald-300 break-all">{card.to}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-slate-400 font-semibold w-12 shrink-0">Subject:</span>
          <span className="font-medium text-white">{card.subject}</span>
        </div>
      </div>

      {/* Body Preview */}
      <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
        {card.body}
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sent Success State */}
      {isSent ? (
        <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Email successfully dispatched via Gmail!</span>
        </div>
      ) : (
        /* Action Buttons */
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(card.body)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition border border-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          )}

          {showConfirm ? (
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="text-xs text-amber-300 font-medium">Confirm Send?</span>
              <button
                onClick={handleApproveSend}
                disabled={isSending}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Yes, Send Now
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-2 py-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" /> Approve & Send
            </button>
          )}
        </div>
      )}
    </div>
  );
}
