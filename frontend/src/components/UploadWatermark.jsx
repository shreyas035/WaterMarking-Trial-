import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  File, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Sliders, 
  ShieldAlert, 
  UserCheck, 
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';

const MAX_SIZE_MB = 25;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export default function UploadWatermark({ onDocumentProcessed }) {
  // File state
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Watermark configuration state
  const [watermarkText, setWatermarkText] = useState('SECURETRACE AI');
  const [watermarkType, setWatermarkType] = useState('visible'); // visible, subtle, invisible
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(36);
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState('diagonal'); // diagonal, center, bottom-right
  const [color, setColor] = useState('#ffffff');
  const [recipientId, setRecipientId] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [processedResult, setProcessedResult] = useState(null);
  const [serverError, setServerError] = useState('');

  const fileInputRef = useRef(null);

  // Validate and load file
  const handleSelectedFile = (selectedFile) => {
    setValidationError('');
    setServerError('');
    setProcessedResult(null);

    if (!selectedFile) return;

    // Check type
    const isAllowedExt = /\.(pdf|png|jpe?g)$/i.test(selectedFile.name);
    if (!ALLOWED_TYPES.includes(selectedFile.type) && !isAllowedExt) {
      setValidationError(`Invalid file format. Supported formats: PDF, PNG, JPG, JPEG.`);
      return;
    }

    // Check size
    if (selectedFile.size > MAX_BYTES) {
      setValidationError(`File exceeds maximum limit of ${MAX_SIZE_MB}MB (${(selectedFile.size / (1024*1024)).toFixed(1)}MB).`);
      return;
    }

    setFile(selectedFile);

    // Generate local preview if image
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
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

  // Submit to FastAPI server
  const handleApplyWatermark = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setServerError('');
    setProgressStatus('Sending document payload to FastAPI server...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('watermark_text', watermarkText);
    formData.append('watermark_type', watermarkType);
    formData.append('opacity', opacity);
    formData.append('font_size', fontSize);
    formData.append('rotation', rotation);
    formData.append('position', position);
    formData.append('color', color);
    if (recipientId) formData.append('recipient_id', recipientId);

    try {
      setTimeout(() => {
        if (isProcessing) setProgressStatus('Executing PyMuPDF / Pillow rasterization and SHA-256 ledger recording...');
      }, 400);

      const response = await apiService.applyWatermark(formData);
      setProcessedResult(response.document);
      setProgressStatus('Document successfully watermarked & registered.');
      if (onDocumentProcessed) {
        onDocumentProcessed(response.document);
      }
    } catch (err) {
      console.error('Watermark error:', err);
      setServerError(err.message || 'An error occurred during server watermarking.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setFilePreview(null);
    setProcessedResult(null);
    setValidationError('');
    setServerError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isPdf = file?.name.toLowerCase().endsWith('.pdf');
  const composedWatermarkText = recipientId.trim() 
    ? `${watermarkText.trim()} | SHARED WITH ${recipientId.trim()}`
    : watermarkText.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="h-5 w-5 text-cyan-400" />
            Upload & Watermark Document
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Embed genuine content watermarks using Python FastAPI server processing.
          </p>
        </div>
        {file && (
          <button
            onClick={handleReset}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear / Select New File
          </button>
        )}
      </div>

      {/* Error Banners */}
      {validationError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="leading-relaxed">{validationError}</div>
        </div>
      )}
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-200">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
          <div className="leading-relaxed">
            <strong className="font-semibold block text-rose-300">Server Error:</strong>
            {serverError}
          </div>
        </div>
      )}

      {/* Main Grid: Upload & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Dropzone & Document Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/30 scale-[0.99]'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-900/80'
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
                <UploadCloud className="h-8 w-8 animate-bounce" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Click to browse or drag & drop file
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Supported: PDF, PNG, JPG, JPEG (Max {MAX_SIZE_MB}MB)
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-700">
                Browse Files
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 shrink-0">
                    {isPdf ? <FileText className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB &bull; {file.type || (isPdf ? 'PDF' : 'Image')}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>

              {/* Source Document Preview */}
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2">
                  Source Preview
                </span>
                {filePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 max-h-56 flex items-center justify-center">
                    <img
                      src={filePreview}
                      alt="Source Preview"
                      className="max-h-56 w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-center text-xs text-slate-400">
                    <FileText className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                    <p className="font-medium text-slate-300">PDF Document Loaded</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Multi-page PDF vector text & layout preserved. Preview will render post-processing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Live Watermark Overlay Simulation (Before Server Submit) */}
          {file && watermarkType !== 'invisible' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 block mb-2 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Live Configuration Preview
              </span>
              <div className="relative h-44 w-full rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center select-none">
                <div className="absolute inset-0 opacity-15 flex flex-col justify-between p-4 text-[10px] text-slate-500 font-mono">
                  <div>DOCUMENT CONTENT TEXT LINE 1</div>
                  <div>SECURE DOCUMENT STREAM VECTOR DATA LINE 2</div>
                  <div>CONFIDENTIAL FINANCIAL / ACADEMIC RECORDS LINE 3</div>
                  <div>DIGITAL SIGNATURE HASH VERIFICATION LINE 4</div>
                </div>
                
                {/* Simulated Watermark Text */}
                <div
                  style={{
                    color: color,
                    opacity: opacity,
                    fontSize: `${Math.min(fontSize * 0.5, 24)}px`,
                    transform: `rotate(${rotation}deg)`,
                    fontWeight: 'bold',
                    position: position === 'bottom-right' ? 'absolute' : 'relative',
                    bottom: position === 'bottom-right' ? '12px' : 'auto',
                    right: position === 'bottom-right' ? '12px' : 'auto',
                    letterSpacing: '0.05em',
                    textShadow: '0 0 10px rgba(0,0,0,0.5)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    maxWidth: '90%'
                  }}
                  className="font-mono uppercase transition-all duration-150 break-words"
                >
                  {composedWatermarkText || 'SECURETRACE AI'}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                This preview visualizes your configuration. The server will render this directly into file bytes.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Watermark Configuration Panel (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleApplyWatermark} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              Watermark Parameters
            </h3>

            {/* Watermark Type Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">
                Watermark Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setWatermarkType('visible');
                    if (opacity < 0.2) setOpacity(0.3);
                  }}
                  className={`rounded-lg p-3 text-left border transition-all cursor-pointer ${
                    watermarkType === 'visible'
                      ? 'border-cyan-500 bg-cyan-950/40 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-200">Visible</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">High-visibility ownership & branding overlay</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWatermarkType('subtle');
                    setOpacity(0.12);
                  }}
                  className={`rounded-lg p-3 text-left border transition-all cursor-pointer ${
                    watermarkType === 'subtle'
                      ? 'border-cyan-500 bg-cyan-950/40 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-200">Subtle</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Low-opacity unobtrusive background security mark</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWatermarkType('invisible');
                  }}
                  className={`rounded-lg p-3 text-left border transition-all cursor-pointer ${
                    watermarkType === 'invisible'
                      ? 'border-emerald-500 bg-emerald-950/40 text-white'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-emerald-400">Invisible Watermark</p>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">LSB Pixel Steganography (Images) & Invisible Content Layer (PDF)</p>
                </button>
              </div>

              {watermarkType === 'invisible' && (
                <div className="mt-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-3 text-xs text-emerald-200 flex items-start gap-2">
                  <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">True Invisible Watermarking Enabled:</span>
                    &bull; <strong>For Images (PNG/JPEG):</strong> Encodes binary text into the least-significant bit (LSB) of color pixels.<br />
                    &bull; <strong>For PDFs:</strong> Injects an invisible vector content layer (render_mode=3, opacity=0) across all pages and registers cryptographic tokens.<br />
                    Human readers cannot see it on screen or print, but it is 100% extractable and verifiable in the Verification Lab!
                  </div>
                </div>
              )}
            </div>

            {/* Watermark Text Input */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="e.g., SECURETRACE AI - CONFIDENTIAL"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>

            {/* Recipient Identification Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                  Recipient Identification (Optional)
                </label>
                <span className="text-[10px] text-slate-400">Tracks document distribution</span>
              </div>
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="e.g., USER-102 or legal@partner.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              {recipientId.trim() && (
                <p className="mt-1 text-[11px] text-cyan-400">
                  Composed mark: <code className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{composedWatermarkText}</code>
                </p>
              )}
            </div>

            {/* Detailed Controls: Opacity, Font Size, Position, Color, Angle (Only for visible & subtle) */}
            {watermarkType !== 'invisible' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                {/* Opacity */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Opacity</span>
                    <span className="text-cyan-400 font-mono">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.9"
                    step="0.01"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Font Size */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Font Size</span>
                    <span className="text-cyan-400 font-mono">{fontSize} pt</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="80"
                    step="2"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Rotation Angle */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Rotation Angle</span>
                    <span className="text-cyan-400 font-mono">{rotation}&deg;</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Position Option */}
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Position</label>
                  <select
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value);
                      if (e.target.value === 'diagonal') setRotation(45);
                      if (e.target.value === 'center') setRotation(0);
                      if (e.target.value === 'bottom-right') setRotation(0);
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="diagonal">Diagonal Across Page</option>
                    <option value="center">Centered Horizontal</option>
                    <option value="bottom-right">Bottom-Right Margin</option>
                  </select>
                </div>

                {/* Color */}
                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="text-xs font-medium text-slate-300">Text Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-slate-700 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-400">{color.toUpperCase()}</span>
                  </div>
                  <div className="flex gap-1.5 ml-auto">
                    {['#ffffff', '#00ffff', '#3b82f6', '#ef4444', '#000000'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setColor(preset)}
                        className={`h-5 w-5 rounded border ${
                          color.toLowerCase() === preset.toLowerCase() ? 'border-cyan-400 scale-110' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: preset }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Button & Status */}
            <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {isProcessing && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{progressStatus}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || isProcessing}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-xs font-semibold text-white shadow-lg transition-all cursor-pointer ${
                  !file || isProcessing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing Server-Side...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    Apply Watermark to File
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Result Section: Download & Cryptographic Verification Details */}
      {processedResult && (
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Document Watermarked & Signed Successfully
                </h3>
                <p className="text-xs text-slate-400">
                  Processed file is ready for download and permanently logged to the SQLite activity ledger.
                </p>
              </div>
            </div>
            
            <a
              href={apiService.getDownloadUrl(processedResult.id)}
              download
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Download Watermarked File
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 block mb-1">Pre-processing Digest:</span>
              <div className="flex justify-between text-slate-400">
                <span>File Name:</span>
                <span className="text-white font-medium">{processedResult.original_filename}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Original Size:</span>
                <span className="text-white font-medium">{(processedResult.original_size_bytes / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex flex-col text-slate-400 pt-1">
                <span>Original SHA-256:</span>
                <span className="font-mono text-[10px] text-cyan-400 break-all select-all mt-0.5 bg-slate-900 p-1.5 rounded border border-slate-800">
                  {processedResult.original_sha256}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 space-y-2">
              <span className="font-semibold text-emerald-400 block mb-1">Post-processing Digest:</span>
              <div className="flex justify-between text-slate-400">
                <span>Watermarked Size:</span>
                <span className="text-white font-medium">{(processedResult.watermarked_size_bytes / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Watermark Type:</span>
                <span className="text-emerald-300 uppercase font-semibold">{processedResult.watermark_type}</span>
              </div>
              <div className="flex flex-col text-slate-400 pt-1">
                <span>Watermarked SHA-256:</span>
                <span className="font-mono text-[10px] text-emerald-400 break-all select-all mt-0.5 bg-slate-900 p-1.5 rounded border border-slate-800">
                  {processedResult.watermarked_sha256}
                </span>
              </div>
            </div>
          </div>

          {/* Processed File Preview (if image) */}
          {processedResult.preview_data_uri && (
            <div className="border-t border-slate-800 pt-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Processed Watermarked Image Output
              </span>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 flex justify-center max-h-72 overflow-hidden">
                <img
                  src={processedResult.preview_data_uri}
                  alt="Watermarked Result Preview"
                  className="max-h-64 object-contain rounded"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
