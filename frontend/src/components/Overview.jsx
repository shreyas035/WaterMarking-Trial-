import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Sliders, 
  History, 
  SearchCheck, 
  Terminal, 
  ExternalLink 
} from 'lucide-react';

export default function Overview({ onNavigate, stats = {} }) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/40 p-6 backdrop-blur-md">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-xs font-semibold text-cyan-300 mb-3">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Prototype v1.0.0 — Final-Year Computer Engineering Project
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            SecureTrace AI — Document Watermarking Lab
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Enterprise grade document security and audit suite. Embeds visible, subtle, and genuine LSB 
            invisible content watermarks into PDFs and images directly on the server with cryptographic SHA-256 ledger tracking.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition-all cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              Upload & Watermark Document
            </button>
            <button
              onClick={() => onNavigate('verify')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <SearchCheck className="h-4 w-4 text-cyan-400" />
              Verify Watermark
            </button>
            <button
              onClick={() => onNavigate('ledger')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <History className="h-4 w-4 text-emerald-400" />
              View Activity Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Real Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Processed</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.totalProcessed || 0}</p>
          <p className="mt-1 text-xs text-slate-400">PDFs and images watermarked</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Active Ledger Logs</span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <History className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.totalLedger || 0}</p>
          <p className="mt-1 text-xs text-slate-400">SHA-256 audit records saved</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Supported Formats</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-white">PDF, PNG, JPG</p>
          <p className="mt-1 text-xs text-slate-400">Max file upload limit 25 MB</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Backend Engine</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Terminal className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-white">PyMuPDF + Pillow</p>
          <p className="mt-1 text-xs text-slate-400">FastAPI & SQLite persistence</p>
        </div>
      </div>

      {/* Watermarking Engineering Specifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Watermarking Modes & Algorithms
          </h3>
          <div className="mt-4 space-y-4 text-xs text-slate-300">
            <div className="border-l-2 border-cyan-500/40 pl-3">
              <span className="font-semibold text-white">1. Visible Watermarking (PDF & Images)</span>
              <p className="mt-0.5 text-slate-400">
                Directly writes transparent vector/raster text layers into PDF content streams (PyMuPDF) or composites antialiased RGBA layers onto images (Pillow).
              </p>
            </div>
            <div className="border-l-2 border-blue-500/40 pl-3">
              <span className="font-semibold text-white">2. Subtle Watermarking (Low-profile overlay)</span>
              <p className="mt-0.5 text-slate-400">
                Low opacity (&lt; 0.15) diagonal or corner marking designed for discrete ownership attribution without hindering readability.
              </p>
            </div>
            <div className="border-l-2 border-emerald-500/40 pl-3">
              <span className="font-semibold text-white">3. Invisible LSB Steganography (Images)</span>
              <p className="mt-0.5 text-slate-400">
                Embeds ASCII watermark bitstream into the least significant bit (LSB) of RGB channels with signature tokens. Imperceptible to the human eye, extractable and verifiable.
              </p>
            </div>
            <div className="border-l-2 border-cyan-500/40 pl-3">
              <span className="font-semibold text-cyan-300">4. Invisible Content-Stream Steganography (PDF)</span>
              <p className="mt-0.5 text-slate-400">
                Embeds invisible vector text (render_mode=3, opacity=0) directly across PDF page content streams. Hidden from viewers and printers, verifiable in the lab.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security & Cryptographic Audit Ledger
          </h3>
          <p className="mt-3 text-xs text-slate-300 leading-relaxed">
            The SecureTrace AI ledger computes and registers cryptographic <strong className="text-white">SHA-256</strong> hashes
            for every document prior to watermarking, alongside the resulting post-processed file.
          </p>
          <div className="mt-4 rounded-lg bg-slate-950/80 p-3 border border-slate-800 text-[11px] font-mono text-slate-400">
            <div className="text-cyan-400 mb-1">// Enterprise Audit Note:</div>
            A modified SHA-256 hash confirms the document bytes changed during watermarking, establishing an immutable timestamped trail. Note that hash modification alone does not prove malicious tampering.
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            <span>Storage: Local SQLite (<code className="text-cyan-400">securetrace.db</code>)</span>
            <span className="text-emerald-400">100% On-Premise Execution</span>
          </div>
        </div>
      </div>
    </div>
  );
}
