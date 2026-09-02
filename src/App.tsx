import React, { useState, useEffect } from 'react';
import { ActivePage, VerificationResult, SamplePresetDocument, DocumentType } from './types';
import { Navbar } from './components/Navbar';
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

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('landing');
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const [geminiLive, setGeminiLive] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<VerificationResult | null>(null);

  // Active analysis in-flight state
  const [activeUploadPayload, setActiveUploadPayload] = useState<{
    fileName: string;
    fileType: string;
    documentTypeLabel: string;
    previewUrl?: string;
    promise: Promise<VerificationResult>;
  } | null>(null);

  // Initialize data on mount
  useEffect(() => {
    // Check server health & gemini availability
    checkServerHealth().then((health) => {
      setGeminiLive(health.geminiLive);
    });

    // Load initial history from server (or sample presets)
    fetchVerificationHistory().then((records) => {
      setHistory(records);
    });
  }, []);

  // Navigation handler
  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
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
    setActiveUploadPayload(null);
    setActivePage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select an existing record to inspect from history or dashboard
  const handleSelectRecord = (record: VerificationResult) => {
    setCurrentResult(record);
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Prototype Compliance Banner */}
      <DemoNoticeBanner />

      {/* Main Header / Navigation */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        geminiLive={geminiLive}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
      <Footer />
    </div>
  );
}
