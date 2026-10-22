import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  UploadCloud, 
  FileCheck, 
  SearchCheck, 
  History, 
  Terminal, 
  User, 
  Cpu,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import Overview from './components/Overview';
import UploadWatermark from './components/UploadWatermark';
import ProcessedDocuments from './components/ProcessedDocuments';
import WatermarkVerification from './components/WatermarkVerification';
import ActivityLedger from './components/ActivityLedger';
import { apiService } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, upload, documents, verify, ledger
  const [documents, setDocuments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [backendStatus, setBackendStatus] = useState('CHECKING'); // CONNECTED, ERROR, CHECKING
  const [backendInfo, setBackendInfo] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Poll backend health & fetch initial data
  const fetchData = async () => {
    try {
      const health = await apiService.getHealth();
      setBackendStatus('CONNECTED');
      setBackendInfo(health);

      const docsRes = await apiService.getDocuments();
      setDocuments(docsRes.documents || []);

      const ledgerRes = await apiService.getLedger();
      setLedger(ledgerRes.ledger || []);
    } catch (err) {
      console.warn('Backend connection check failed:', err);
      setBackendStatus('ERROR');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleDocumentProcessed = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    fetchData();
    triggerToast(`Document "${newDoc.original_filename}" watermarked and logged successfully!`);
  };

  const handleVerifyDocument = (doc) => {
    setActiveTab('verify');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload & Watermark', icon: UploadCloud },
    { id: 'documents', label: 'Processed Documents', icon: FileCheck, badge: documents.length },
    { id: 'verify', label: 'Watermark Verification', icon: SearchCheck },
    { id: 'ledger', label: 'Activity Ledger', icon: History, badge: ledger.length },
  ];

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-cyan-500/40 bg-slate-900/95 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <div className="rounded-full bg-cyan-500/20 p-1 text-cyan-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>{notification.msg}</div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-2 text-white shadow-md shadow-cyan-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-white uppercase">
                    SecureTrace AI
                  </h1>
                  <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-400 border border-cyan-800">
                    LAB
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none">
                  Document Watermarking & Verification Engine
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Status & Avatar */}
          <div className="flex items-center gap-4">
            {/* Backend Health Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === 'CONNECTED'
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : backendStatus === 'CHECKING'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-[11px] font-medium text-slate-300">
                {backendStatus === 'CONNECTED' ? 'Engine Online' : backendStatus === 'CHECKING' ? 'Connecting...' : 'Engine Offline'}
              </span>
            </div>

            {/* User Session Profile Avatar (Integration placeholder) */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-cyan-400">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">Lab Auditor</p>
                <p className="text-[10px] text-slate-500 leading-none mt-1">user-admin@securetrace.local</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-md pt-16 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:pt-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col justify-between p-4">
            <div className="space-y-1">
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Navigation
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sidebar Footer System Info */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                Backend Service
              </div>
              <div className="text-[10px] text-slate-400 space-y-1">
                <div>Port: <span className="font-mono text-cyan-300">8000 (FastAPI)</span></div>
                <div>Storage: <span className="font-mono text-slate-300">SQLite + Local FS</span></div>
                <div>Hash: <span className="font-mono text-emerald-400">SHA-256</span></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {activeTab === 'overview' && (
              <Overview
                onNavigate={(tab) => setActiveTab(tab)}
                stats={{
                  totalProcessed: documents.length,
                  totalLedger: ledger.length
                }}
              />
            )}
            {activeTab === 'upload' && (
              <UploadWatermark
                onDocumentProcessed={handleDocumentProcessed}
              />
            )}
            {activeTab === 'documents' && (
              <ProcessedDocuments
                documents={documents}
                onRefresh={fetchData}
                onVerifyDocument={handleVerifyDocument}
              />
            )}
            {activeTab === 'verify' && (
              <WatermarkVerification />
            )}
            {activeTab === 'ledger' && (
              <ActivityLedger
                ledger={ledger}
                onRefresh={fetchData}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
