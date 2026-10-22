import React, { useState, useRef } from 'react';
import { 
  SearchCheck, 
  UploadCloud, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle,
  FileText,
  Binary,
  RefreshCw,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';

export default function WatermarkVerification() {
  const [file, setFile] = useState(null);
  const [expectedWatermark, setExpectedWatermark] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const handleSelectedFile = (selected) => {
    setErrorMsg('');
    setVerificationResult(null);
    if (!selected) return;
    setFile(selected);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsVerifying(true);
    setErrorMsg('');
    setVerificationResult(null);

    const formData = new FormData();
    formData.append('file', file);
    if (expectedWatermark.trim()) {
      formData.append('expected_watermark', expectedWatermark.trim());
    }

    try {
      const res = await apiService.verifyWatermark(formData);
      setVerificationResult(res.verification);
    } catch (err) {
      console.error('Verification error:', err);
      setErrorMsg(err.message || 'Verification check failed on the server.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setVerificationResult(null);
    setExpectedWatermark('');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <SearchCheck className="h-5 w-5 text-cyan-400" />
            Watermark Verification Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Perform server-side content inspection & LSB steganography watermark extraction.
          </p>
        </div>
        {file && (
          <button
            onClick={handleReset}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Verification
          </button>
        )}
      </div>

      {/* Methodology and Cryptographic Disclaimer Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-cyan-400">
          <Info className="h-4 w-4" />
          Verification Methodology & Scientific Constraints
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          &bull; <strong>LSB Invisible Watermarks:</strong> True content-level pixel analysis extracts the exact embedded binary bit-plane payload from PNG images.<br />
          &bull; <strong>PDF & Visual Marks:</strong> Scans PDF text content streams. For visible watermarks rendered directly into raster pixels (e.g. JPEG), visual overlays cannot provide mathematical proof without optical OCR.<br />
          &bull; <strong>Integrity vs Verification:</strong> SHA-256 confirms document identity; watermark verification checks for authenticated watermark tokens.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Verification Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/30'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => handleSelectedFile(e.target.files?.[0])}
              />
              <div className="rounded-full bg-cyan-500/10 p-4 text-cyan-400 mb-3">
                <SearchCheck className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Select document to inspect
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Upload a watermarked PDF or Image (PNG/JPEG)
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="rounded-lg bg-cyan-500/10 p-2.5 text-cyan-400 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB &bull; Ready for content analysis
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verification Controls */}
        <div className="lg:col-span-6">
          <form onSubmit={handleVerify} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Binary className="h-4 w-4 text-cyan-400" />
              Verification Parameters
            </h3>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Expected Watermark String (Optional)
              </label>
              <input
                type="text"
                value={expectedWatermark}
                onChange={(e) => setExpectedWatermark(e.target.value)}
                placeholder="e.g., SECURETRACE AI or USER-102"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If omitted, the server extracts any available LSB payload or scans for default SecureTrace signatures.
              </p>
            </div>

            <button
              type="submit"
              disabled={!file || isVerifying}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-all cursor-pointer ${
                !file || isVerifying
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
              }`}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Server-Side Inspection...
                </>
              ) : (
                <>
                  <SearchCheck className="h-4 w-4" />
                  Verify Document
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Verification Result Showcase */}
      {verificationResult && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            {verificationResult.status === 'DETECTED' && (
              <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="h-7 w-7" />
              </div>
            )}
            {verificationResult.status === 'NOT_DETECTED' && (
              <div className="rounded-full bg-rose-500/10 p-2.5 text-rose-400 border border-rose-500/30">
                <XCircle className="h-7 w-7" />
              </div>
            )}
            {verificationResult.status === 'UNABLE_TO_VERIFY' && (
              <div className="rounded-full bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/30">
                <HelpCircle className="h-7 w-7" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Verification Status:</span>
                <span className={`text-sm font-bold uppercase px-2 py-0.5 rounded ${
                  verificationResult.status === 'DETECTED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : verificationResult.status === 'NOT_DETECTED'
                    ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                }`}>
                  {verificationResult.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {verificationResult.details}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 block mb-1">Inspection Findings:</span>
              <div className="flex justify-between text-slate-400">
                <span>Method Applied:</span>
                <span className="text-cyan-400 font-medium">{verificationResult.method_used}</span>
              </div>
              {verificationResult.extracted_watermark && (
                <div className="flex flex-col text-slate-400 pt-1">
                  <span>Extracted Content:</span>
                  <span className="font-mono text-xs text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800 break-all select-all mt-1">
                    {verificationResult.extracted_watermark}
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 block mb-1">Cryptographic Fingerprint:</span>
              <div className="flex flex-col text-slate-400">
                <span>File SHA-256 Hash:</span>
                <span className="font-mono text-[10px] text-cyan-400 bg-slate-900 p-2 rounded border border-slate-800 break-all select-all mt-1">
                  {verificationResult.file_sha256}
                </span>
              </div>
              {verificationResult.limitations_note && (
                <div className="text-[11px] text-slate-400 border-t border-slate-850 pt-2 leading-relaxed">
                  <strong>Notice:</strong> {verificationResult.limitations_note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
