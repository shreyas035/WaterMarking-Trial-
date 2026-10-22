import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Clock, 
  Tag, 
  ExternalLink, 
  Search,
  Filter,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { apiService } from '../services/api';

export default function ProcessedDocuments({ documents = [], onRefresh, onVerifyDocument }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.watermark_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.recipient_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = typeFilter === 'ALL' || doc.watermark_type?.toUpperCase() === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-cyan-400" />
            Processed Documents
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse and download watermarked assets stored in server-side persistence.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
        >
          Refresh List
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by filename, recipient, or watermark text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="VISIBLE">Visible</option>
            <option value="SUBTLE">Subtle</option>
            <option value="INVISIBLE">Invisible (LSB)</option>
          </select>
        </div>
      </div>

      {/* Documents List / Cards */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No Processed Documents Found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {documents.length === 0 
              ? 'No documents have been watermarked yet. Upload a document in the "Upload & Watermark" tab to start.'
              : 'No documents match your search filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isPdf = doc.mime_type?.includes('pdf') || doc.original_filename?.toLowerCase().endsWith('.pdf');
            const dateStr = new Date(doc.created_at).toLocaleString();

            return (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                      doc.watermark_type === 'invisible'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : doc.watermark_type === 'subtle'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {doc.watermark_type}
                    </span>
                    <span className="text-[10px] text-slate-400">{dateStr}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white truncate" title={doc.original_filename}>
                    {doc.original_filename}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {(doc.watermarked_size_bytes / 1024).toFixed(1)} KB &bull; {isPdf ? 'PDF Document' : 'Image Asset'}
                  </p>

                  <div className="mt-3 rounded-lg bg-slate-950 p-2.5 border border-slate-800/80 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Watermark Text:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[140px]" title={doc.watermark_text}>
                        {doc.watermark_text}
                      </span>
                    </div>
                    {doc.recipient_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recipient:</span>
                        <span className="text-cyan-400 font-medium">{doc.recipient_id}</span>
                      </div>
                    )}
                    <div className="pt-1 border-t border-slate-850">
                      <span className="text-slate-500 block text-[10px]">SHA-256 (Post-processed):</span>
                      <span className="font-mono text-[9px] text-emerald-400 truncate block select-all">
                        {doc.watermarked_sha256}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <a
                    href={apiService.getDownloadUrl(doc.id)}
                    download
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download File
                  </a>
                  {onVerifyDocument && (
                    <button
                      onClick={() => onVerifyDocument(doc)}
                      title="Verify in Watermark Verification Lab"
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
