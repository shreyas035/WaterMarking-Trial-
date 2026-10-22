import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Database, 
  Hash, 
  Clock, 
  ExternalLink,
  Info,
  RefreshCw
} from 'lucide-react';

export default function ActivityLedger({ ledger = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredRecords = ledger.filter((item) => {
    const matchesSearch = 
      item.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.original_sha256?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || item.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="h-5 w-5 text-cyan-400" />
            Activity Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Conventional database-backed audit log recording all watermarking and verification events.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Ledger
        </button>
      </div>

      {/* Enterprise Notice Callout */}
      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 text-xs text-slate-300 space-y-1.5 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-semibold text-cyan-400">
          <Database className="h-4 w-4" />
          Database Audit Architecture
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          This ledger is persisted in a local SQLite database (<code className="text-cyan-300 font-mono">securetrace.db</code>).
          It computes and stores pre- and post-processing <strong className="text-slate-200">SHA-256 cryptographic hashes</strong> via Python's <code className="text-slate-300">hashlib</code>.
          <strong> Note:</strong> A changed SHA-256 hash confirms that the document bytes were transformed by the watermarking engine; it does not by itself prove malicious tampering.
          This audit ledger is not a blockchain.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by file name, SHA-256 hash, or recipient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Operations</option>
            <option value="DOCUMENT_WATERMARKED">Watermarking</option>
            <option value="WATERMARK_VERIFIED">Verification</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Document Filename</th>
                <th className="px-4 py-3">Action / Type</th>
                <th className="px-4 py-3">Recipient Identifier</th>
                <th className="px-4 py-3">Pre / Post SHA-256 Hashes</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No ledger records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((entry) => {
                  const dateStr = new Date(entry.timestamp).toLocaleString();
                  const isWatermark = entry.action === 'DOCUMENT_WATERMARKED';

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-white max-w-[180px] truncate" title={entry.filename}>
                        {entry.filename}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          isWatermark
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                        {entry.watermark_type && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Type: {entry.watermark_type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        {entry.recipient_id && entry.recipient_id !== 'UNSPECIFIED' ? (
                          <span className="font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {entry.recipient_id}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-[260px]">
                        <div className="space-y-1">
                          <div className="truncate font-mono text-[10px] text-slate-400" title={entry.original_sha256}>
                            <span className="text-slate-500">Orig:</span> {entry.original_sha256?.substring(0, 24)}...
                          </div>
                          {isWatermark && (
                            <div className="truncate font-mono text-[10px] text-emerald-400" title={entry.watermarked_sha256}>
                              <span className="text-slate-500">Wm:</span> {entry.watermarked_sha256?.substring(0, 24)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          entry.status === 'PROCESSED' || entry.status === 'DETECTED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : entry.status === 'NOT_DETECTED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
