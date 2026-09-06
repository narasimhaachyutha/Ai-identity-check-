import React, { useState, useEffect } from 'react';
import { ActivePage, VerificationResult, SamplePresetDocument, DocumentType } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, ScreeningTab } from './components/Sidebar';
import { Footer } from './components/Footer';
import { DemoNoticeBanner } from './components/DemoNoticeBanner';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SAMPLE_PRESET_DOCUMENTS } from './data/sampleDocuments';
import {
  checkServerHealth,
  fetchVerificationHistory,
  saveVerificationRecord,
  clearServerHistory,
  analyzeDocumentAPI,
} from './services/api';
import { useAuth } from './context/AuthContext';
import { subscribeToVerifications } from './lib/firebase';

export default function App() {
  const { currentUser } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [activeScreeningTab, setActiveScreeningTab] = useState<ScreeningTab>('overview');
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const [geminiLive, setGeminiLive] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<VerificationResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Active analysis in-flight state
  const [activeUploadPayload, setActiveUploadPayload] = useState<{
    fileName: string;
    fileType: string;
    documentTypeLabel: string;
    previewUrl?: string;
    promise: Promise<VerificationResult>;
  } | null>(null);

  // Initialize data on mount and on user auth state change
  useEffect(() => {
    // Check server health & gemini availability
    checkServerHealth().then((health) => {
      setGeminiLive(health.geminiLive);
    });

    // If user is authenticated, subscribe to real-time Firestore synchronization
    if (currentUser) {
      const unsubscribe = subscribeToVerifications(
        currentUser,
        (records) => {
          if (records.length > 0) {
            setHistory(records);
            setCurrentResult((prev) => prev || records[0]);
          } else {
            // New user account: populate initial view with sample presets for inspection
            const sampleResults = SAMPLE_PRESET_DOCUMENTS.map((p) => p.mockResult);
            setHistory(sampleResults);
            if (sampleResults.length > 0) {
              setCurrentResult((prev) => prev || sampleResults[0]);
            }
          }
        },
        (error) => {
          console.warn('Real-time subscription error, using fallback:', error);
        }
      );
      return () => unsubscribe();
    } else {
      // Unauthenticated fallback: Load initial history from server / presets
      fetchVerificationHistory().then((records) => {
        setHistory(records);
        if (records && records.length > 0) {
          setCurrentResult((prev) => prev || records[0]);
        }
      });
    }
  }, [currentUser]);

  // Navigation handler
  const handleNavigate = (page: ActivePage, tab?: ScreeningTab) => {
    setActivePage(page);
    if (tab) {
      setActiveScreeningTab(tab);
    }
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start analysis workflow from upload page or preset
  const handleStartAnalysis = (fileData: {
    fileBase64?: string;
    fileName: string;
    fileType: string;
    fileSizeFormatted: string;
    documentType: DocumentType;
    documentTypeLabel: string;
    presetId?: string;
  }) => {
    const analysisPromise = analyzeDocumentAPI(fileData);

    setActiveUploadPayload({
      fileName: fileData.fileName,
      fileType: fileData.fileType,
      documentTypeLabel: fileData.documentTypeLabel,
      previewUrl: fileData.fileBase64,
      promise: analysisPromise,
    });

    setActivePage('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select test preset directly
  const handleSelectPreset = (preset: SamplePresetDocument) => {
    handleStartAnalysis({
      fileBase64: preset.mockResult.imagePreviewUrl,
      fileName: preset.mockResult.fileName,
      fileType: preset.mockResult.fileType,
      fileSizeFormatted: preset.mockResult.fileSizeFormatted,
      documentType: preset.documentType,
      documentTypeLabel: preset.mockResult.documentTypeLabel,
      presetId: preset.id,
    });
  };

  // When analysis is completed
  const handleAnalysisComplete = (result: VerificationResult) => {
    setCurrentResult(result);
    // Prepend to history
    setHistory((prev) => [result, ...prev.filter((r) => r.id !== result.id)]);
    // Save to Cloud Firestore & server cache
    saveVerificationRecord(result).catch((err) => {
      console.warn('Failed to persist new verification record:', err);
    });
    setActiveUploadPayload(null);
    setActiveScreeningTab('overview');
    setActivePage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select an existing record to inspect from history or dashboard
  const handleSelectRecord = (record: VerificationResult) => {
    setCurrentResult(record);
    setActiveScreeningTab('overview');
    setActivePage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all history
  const handleClearHistory = async () => {
    await clearServerHistory();
    setHistory([]);
  };

  // Reset to default sample presets
  const handleResetSampleHistory = () => {
    const sampleResults = SAMPLE_PRESET_DOCUMENTS.map((p) => p.mockResult);
    setHistory(sampleResults);
    if (sampleResults.length > 0) {
      setCurrentResult(sampleResults[0]);
    }
  };

  // When a result is updated (e.g. biometric retest on results page)
  const handleUpdateResult = (updated: VerificationResult) => {
    setCurrentResult(updated);
    setHistory((prev) => [updated, ...prev.filter((r) => r.id !== updated.id)]);
    // Also persist to backend history store
    saveVerificationRecord(updated).catch((err) => {
      console.warn('Failed to persist updated record:', err);
    });
  };

  const showSidebar = activePage !== 'landing';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Prototype Compliance Banner */}
      <DemoNoticeBanner />

      {/* Main Checkpoint Header / Navigation */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        geminiLive={geminiLive}
        historyCount={history.length}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Checkpoint Terminal Navigation Sidebar */}
      {showSidebar && (
        <Sidebar
          activePage={activePage}
          activeScreeningTab={activeScreeningTab}
          onNavigate={handleNavigate}
          hasActiveResult={Boolean(currentResult)}
          historyCount={history.length}
          geminiLive={geminiLive}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area (with responsive offset for sidebar) */}
      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 transition-all ${
          showSidebar ? 'lg:pl-80 max-w-7xl' : 'max-w-7xl'
        }`}
      >
        {activePage === 'landing' && (
          <LandingPage
            onStartVerification={() => handleNavigate('upload')}
            onSelectPreset={handleSelectPreset}
            onGoToDashboard={() => handleNavigate('dashboard')}
          />
        )}

        {activePage === 'dashboard' && (
          <DashboardPage
            history={history}
            onSelectRecord={handleSelectRecord}
            onNavigateToUpload={() => handleNavigate('upload')}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {activePage === 'upload' && (
          <UploadPage
            onAnalyzeFile={handleStartAnalysis}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {activePage === 'analysis' && activeUploadPayload && (
          <AnalysisPage
            fileName={activeUploadPayload.fileName}
            fileType={activeUploadPayload.fileType}
            documentTypeLabel={activeUploadPayload.documentTypeLabel}
            previewUrl={activeUploadPayload.previewUrl}
            analysisPromise={activeUploadPayload.promise}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {activePage === 'results' && currentResult && (
          <ResultsPage
            result={currentResult}
            onVerifyAnother={() => handleNavigate('upload')}
            onGoToHistory={() => handleNavigate('history')}
            onUpdateResult={handleUpdateResult}
            initialTab={activeScreeningTab}
          />
        )}

        {activePage === 'history' && (
          <HistoryPage
            history={history}
            onSelectRecord={handleSelectRecord}
            onClearHistory={handleClearHistory}
            onNavigateToUpload={() => handleNavigate('upload')}
            onResetSampleHistory={handleResetSampleHistory}
          />
        )}
      </main>

      {/* Footer */}
      <div className={showSidebar ? 'lg:pl-72' : ''}>
        <Footer />
      </div>
    </div>
  );
}
