import React from 'react';
import {
  X,
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  Share,
  PlusSquare,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';

export default function InstallModal({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isIOS,
  onInstall
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-lg shadow-md shadow-emerald-500/20 select-none">
              🦥
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Pasang malas sebagai Aplikasi
              </h3>
              <p className="text-[11px] text-slate-400">
                Progressive Web App (PWA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          {isInstalled ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-400 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-semibold block">Aplikasi Sudah Dipasang!</span>
                <span className="text-slate-300 text-[11px]">
                  Anda sedang menjalankan malas dalam mod aplikasi kendiri (Standalone App).
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Primary Action Button (If Browser supports one-click install) */}
              {isInstallable ? (
                <div className="space-y-2">
                  <button
                    onClick={onInstall}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>Pasang Sekarang (Install App)</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    Satu klik untuk menambah malas ke skrin utama atau desktop anda.
                  </p>
                </div>
              ) : isIOS ? (
                /* iOS Safari specific manual instructions */
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Panduan Pemasangan iPhone & iPad (Safari):</span>
                  </div>
                  <ol className="space-y-2 text-slate-300 text-[11px] list-decimal list-inside pl-1">
                    <li>
                      Tekan butang <strong className="text-white">Kongsi (Share)</strong>{' '}
                      <Share className="inline w-3.5 h-3.5 text-sky-400 mx-1 align-sub" /> di bar bawah Safari.
                    </li>
                    <li>
                      Skrol ke bawah menu dan tekan{' '}
                      <strong className="text-white">"Add to Home Screen"</strong> (Tambah ke Skrin Utama).
                    </li>
                    <li>
                      Tekan <strong className="text-emerald-400">"Add"</strong> di penjuru atas kanan.
                    </li>
                  </ol>
                </div>
              ) : (
                /* Desktop / Android alternate manual instructions */
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-emerald-400" />
                    <span>Panduan Pelayar Komputer & Telefon:</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Jika butang pasang automatik tidak muncul, tekan menu pelayar anda (tiga titik di kanan atas) dan pilih{' '}
                    <strong className="text-white">"Install app"</strong> atau{' '}
                    <strong className="text-white">"Add to Home Screen"</strong>. Anda juga boleh menekan ikon pasang di bar alamat URL.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Benefits Cards */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Kelebihan Menggunakan Mod Aplikasi:
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/50">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200 text-[11px]">Akses Pantas & Paparan Penuh</div>
                  <div className="text-[10px] text-slate-400">
                    Buka terus seperti perisian desktop atau app telefon tanpa gangguan bar navigasi pelayar.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/50">
                <HardDrive className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200 text-[11px]">Muat Pantas & Cache Luar Talian</div>
                  <div className="text-[10px] text-slate-400">
                    Aset sistem disimpan dalam Service Worker untuk pembukaan sepantas kilat.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/50">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200 text-[11px]">100% Storan Tempatan</div>
                  <div className="text-[10px] text-slate-400">
                    Kunci API dan emel anda kekal selamat sepenuhnya di dalam IndexedDB peranti anda.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
