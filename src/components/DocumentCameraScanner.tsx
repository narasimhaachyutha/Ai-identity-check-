import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  ScanLine,
  ArrowRight,
  Shield,
  Info,
  Maximize2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { DocumentType } from '../types';

export interface CapturedDocumentData {
  fileBase64: string;
  blob: Blob;
  fileName: string;
  fileType: string;
  fileSizeFormatted: string;
}

export interface DocumentCameraScannerProps {
  documentType: DocumentType;
  documentTypeLabel: string;
  onCaptureComplete: (capturedData: CapturedDocumentData) => void;
  onClose: () => void;
}

type CameraStatus = 'INITIALIZING' | 'ACTIVE' | 'CAPTURED' | 'ERROR';
type CameraErrorType = 'permission_denied' | 'no_device' | 'in_use' | 'unsupported' | 'general';

export const DocumentCameraScanner: React.FC<DocumentCameraScannerProps> = ({
  documentType,
  documentTypeLabel,
  onCaptureComplete,
  onClose,
}) => {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('INITIALIZING');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  // Captured photo state
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedResolution, setCapturedResolution] = useState<{ width: number; height: number } | null>(null);
  const [capturedSizeFormatted, setCapturedSizeFormatted] = useState<string>('');

  // Live video feed stats
  const [liveResolution, setLiveResolution] = useState<{ width: number; height: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Error handling
  const [errorType, setErrorType] = useState<CameraErrorType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Safe camera stream terminator
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.warn('[CameraScanner] Error stopping tracks:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Enumerate available video inputs
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
    } catch (err) {
      console.warn('[CameraScanner] Error enumerating devices:', err);
    }
  }, []);

  // Start / restart live camera stream
  const startCamera = useCallback(async (targetFacingMode: 'environment' | 'user', deviceId?: string) => {
    stopCamera();
    setErrorType(null);
    setErrorMessage(null);
    setCameraStatus('INITIALIZING');

    // 1. Check API support & secure context
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setErrorType('unsupported');
      setErrorMessage('Live camera capture requires a secure HTTPS connection or localhost.');
      setCameraStatus('ERROR');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorType('unsupported');
      setErrorMessage('Your browser does not support the WebRTC MediaDevices camera API.');
      setCameraStatus('ERROR');
      return;
    }

    try {
      // Build constraints with high-resolution preferences for document text clarity
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
            }
          : {
              facingMode: targetFacingMode,
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
            },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        // If high resolution fails or exact deviceId fails, fall back to basic constraints
        console.warn('[CameraScanner] Strict constraints failed, falling back to basic:', firstErr);
        const fallbackConstraints: MediaStreamConstraints = {
          audio: false,
          video: { facingMode: targetFacingMode },
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setLiveResolution({
              width: videoRef.current.videoWidth || 1280,
              height: videoRef.current.videoHeight || 720,
            });
          }
        };

        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('[CameraScanner] Video autoplay interrupted:', playErr);
        }
      }

      // Track active device details
      const activeTrack = stream.getVideoTracks()[0];
      if (activeTrack) {
        const settings = activeTrack.getSettings?.();
        if (settings?.deviceId) {
          setCurrentDeviceId(settings.deviceId);
        }
      }

      setCameraStatus('ACTIVE');
      refreshDevices();
    } catch (err: any) {
      console.error('[CameraScanner] Camera access failed:', err);
      stopCamera();

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorType('permission_denied');
        setErrorMessage(
          'Camera access was denied by your browser. Camera permission is required to capture live document photos at this checkpoint.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorType('no_device');
        setErrorMessage('No camera device was detected. Please connect a webcam or use file upload.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorType('in_use');
        setErrorMessage('The camera is currently locked or in use by another tab or app.');
      } else {
        setErrorType('general');
        setErrorMessage(err.message || 'An unexpected error occurred while accessing the camera.');
      }
      setCameraStatus('ERROR');
    }
  }, [stopCamera, refreshDevices]);

  // Initial camera startup
  useEffect(() => {
    startCamera(facingMode);

    // Guaranteed cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [facingMode, startCamera, stopCamera]);

  // Switch camera: toggle facing mode or cycle available device inputs
  const handleSwitchCamera = () => {
    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex((d) => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevice = videoDevices[nextIndex];
      if (nextDevice?.deviceId) {
        startCamera(facingMode, nextDevice.deviceId);
        return;
      }
    }

    // Toggle facing mode fallback
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
  };

  // Capture photo from live video feed
  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.videoWidth === 0) return;

    setIsCapturing(true);

    try {
      const width = video.videoWidth;
      const height = video.videoHeight;

      // Render video frame onto offscreen canvas at actual video resolution
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to initialize 2D canvas context for camera capture');
      }

      // Draw image
      ctx.drawImage(video, 0, 0, width, height);

      // Convert to high-quality JPEG Data URL & Blob
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCapturedBlob(blob);
            setCapturedSizeFormatted(formatBytes(blob.size));
          } else {
            // Fallback size estimation from base64
            const cleanBase64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
            const byteSize = (cleanBase64.length * 3) / 4;
            setCapturedSizeFormatted(formatBytes(byteSize));
          }
          setCapturedDataUrl(dataUrl);
          setCapturedResolution({ width, height });
          setCameraStatus('CAPTURED');
          setIsCapturing(false);

          // Pause video stream display during preview
          try {
            video.pause();
          } catch {
            // ignore
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error('[CameraScanner] Capture failed:', err);
      setIsCapturing(false);
    }
  };

  // Retake photo: discard captured frame and resume live camera feed
  const handleRetakePhoto = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setCapturedResolution(null);
    setCapturedSizeFormatted('');

    if (videoRef.current && streamRef.current) {
      try {
        videoRef.current.play();
      } catch {
        startCamera(facingMode);
        return;
      }
    } else {
      startCamera(facingMode);
      return;
    }

    setCameraStatus('ACTIVE');
  };

  // Confirm photo: pass to existing analysis pipeline & cleanup camera
  const handleUsePhoto = () => {
    if (!capturedDataUrl) return;

    // Stop camera tracks immediately so browser indicator turns off
    stopCamera();

    const timestamp = Date.now();
    const cleanDocType = documentType.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const generatedFileName = `camera-scan-${cleanDocType}-${timestamp}.jpg`;

    // Create Blob if not already cached
    const blobToSend =
      capturedBlob ||
      new Blob([capturedDataUrl], {
        type: 'image/jpeg',
      });

    onCaptureComplete({
      fileBase64: capturedDataUrl,
      blob: blobToSend,
      fileName: generatedFileName,
      fileType: 'image/jpeg',
      fileSizeFormatted: capturedSizeFormatted || '420 KB',
    });
  };

  // Close scanner completely
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Aspect ratio helper based on document category
  const isCardDocument =
    documentType === 'national_id' ||
    documentType === 'drivers_license' ||
    documentType === 'residence_permit';

  return (
    <div
      id="document-camera-scanner-modal"
      className="relative rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden transition-all"
    >
      {/* 1. Header HUD Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/95 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                Live Document Acquisition Scanner
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-700 text-sky-300 text-[10px] font-mono font-bold uppercase">
                {documentTypeLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ICAO 9303 & ISO/IEC 7810 optical positioning guide
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cameraStatus === 'ACTIVE' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                FEED ACTIVE {liveResolution ? `• ${liveResolution.width}×${liveResolution.height}` : ''}
              </span>
            </div>
          )}

          <button
            id="close-camera-scanner-btn"
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Viewport & Scanning Canvas */}
      <div className="relative bg-black w-full min-h-[380px] sm:min-h-[440px] flex items-center justify-center overflow-hidden select-none">
        {/* Hidden video element for stream */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover max-h-[520px] ${
            cameraStatus === 'ACTIVE' ? 'block' : 'hidden'
          }`}
        />

        {/* Hidden canvas for drawing snapshots */}
        <canvas ref={canvasRef} className="hidden" />

        {/* --- STATE A: Loading / Initializing --- */}
        {cameraStatus === 'INITIALIZING' && (
          <div className="p-8 text-center space-y-4 max-w-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-950/80 border border-sky-700 flex items-center justify-center text-sky-400 animate-pulse shadow-lg shadow-sky-950/50">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200">
                Opening Live Camera Feed...
              </p>
              <p className="text-xs text-slate-400">
                Requesting browser camera authorization. Please allow camera permissions when prompted.
              </p>
            </div>
          </div>
        )}

        {/* --- STATE B: Camera Access Error / Denied --- */}
        {cameraStatus === 'ERROR' && (
          <div className="p-6 sm:p-8 text-center space-y-4 max-w-md my-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/80 border border-rose-700 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
              <CameraOff className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-white">
                {errorType === 'permission_denied'
                  ? 'Camera Permission Denied'
                  : errorType === 'no_device'
                  ? 'No Camera Device Detected'
                  : 'Unable to Access Camera'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {errorMessage}
              </p>
              {errorType === 'permission_denied' && (
                <p className="text-[11px] text-amber-400/90 pt-1 font-mono">
                  Tip: Look for the camera / lock icon in your browser URL bar, enable permissions for this site, and click Retry below.
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                id="camera-retry-permission-btn"
                onClick={() => startCamera(facingMode)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera Permission</span>
              </button>
              <button
                type="button"
                id="camera-error-close-btn"
                onClick={handleClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Return to File Upload
              </button>
            </div>
          </div>
        )}

        {/* --- STATE C: Live Camera Active with Rectangular Document Alignment Frame --- */}
        {cameraStatus === 'ACTIVE' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Darkened Mask Vignette Overlay */}
            <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />

            {/* Instruction Floating Pill */}
            <div className="relative z-10 mb-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-sky-500/40 text-sky-200 text-xs font-bold tracking-wide shadow-xl flex items-center gap-2 backdrop-blur-md">
              <ScanLine className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Position document inside the frame</span>
            </div>

            {/* Rectangular Document Guide Frame */}
            <div
              className={`relative z-10 w-full max-w-[480px] sm:max-w-[560px] ${
                isCardDocument ? 'aspect-[1.58/1]' : 'aspect-[1.42/1]'
              } rounded-2xl border-2 border-dashed border-sky-400/70 shadow-[0_0_25px_rgba(56,189,248,0.25)] flex flex-col justify-between p-3 sm:p-4 transition-all`}
            >
              {/* Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-lg" />

              {/* Laser Scanning Line Animation */}
              <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_rgba(56,189,248,0.9)] animate-pulse" />

              {/* Watermark / Guidance inside frame */}
              <div className="flex items-center justify-between text-[10px] font-mono text-sky-300/80 font-semibold uppercase tracking-wider">
                <span>{documentTypeLabel} Optical Boundary</span>
                <span>ISO/IEC Guide</span>
              </div>

              <div className="text-center py-2">
                <p className="text-[11px] font-medium text-slate-300/90 drop-shadow-md bg-slate-950/60 inline-block px-3 py-1 rounded-full backdrop-blur-sm border border-slate-800/80">
                  Keep document flat • Ensure all 4 corners are visible • Avoid glare
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>MRZ / VIZ SCAN ZONE</span>
                <span>HOLD STEADY</span>
              </div>
            </div>
          </div>
        )}

        {/* --- STATE D: Captured Image Preview --- */}
        {cameraStatus === 'CAPTURED' && capturedDataUrl && (
          <div className="relative w-full h-full max-h-[520px] flex items-center justify-center bg-slate-950">
            <img
              src={capturedDataUrl}
              alt="Captured Document Preview"
              className="max-h-[460px] w-auto max-w-full object-contain rounded-xl border border-slate-700 shadow-2xl"
            />

            {/* Captured overlay badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-lg backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Document Snapshot Captured</span>
              {capturedResolution && (
                <span className="text-slate-400 font-mono text-[11px]">
                  • {capturedResolution.width}×{capturedResolution.height}
                </span>
              )}
              {capturedSizeFormatted && (
                <span className="text-slate-400 font-mono text-[11px]">
                  • {capturedSizeFormatted}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Camera Controls Bar */}
      <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left helper info */}
        <div className="text-xs text-slate-400 flex items-center gap-2 text-center sm:text-left">
          <Shield className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            {cameraStatus === 'CAPTURED'
              ? 'Review the captured document. If text and corners are sharp, proceed to screening.'
              : 'Hold document steady inside the frame and ensure good ambient lighting.'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
          {/* Controls during LIVE STREAM */}
          {cameraStatus === 'ACTIVE' && (
            <>
              {/* Switch Camera Button (Front / Rear) */}
              <button
                type="button"
                id="switch-camera-btn"
                onClick={handleSwitchCamera}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 hover:border-slate-600 cursor-pointer"
                title="Switch Camera (Front / Rear)"
              >
                <SwitchCamera className="w-4 h-4 text-sky-400" />
                <span>Switch Camera</span>
              </button>

              {/* Primary Shutter Button: Capture Photo */}
              <button
                type="button"
                id="capture-photo-btn"
                onClick={handleCapturePhoto}
                disabled={isCapturing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-950/60 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Photo</span>
              </button>

              {/* Close Camera Button */}
              <button
                type="button"
                id="live-close-camera-btn"
                onClick={handleClose}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                Close Camera
              </button>
            </>
          )}

          {/* Controls during PREVIEW (Captured state) */}
          {cameraStatus === 'CAPTURED' && (
            <>
              {/* Retake Button */}
              <button
                type="button"
                id="retake-photo-btn"
                onClick={handleRetakePhoto}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 hover:border-slate-600 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Retake</span>
              </button>

              {/* Use Photo Button (Dispatches to Screening Analysis) */}
              <button
                type="button"
                id="use-photo-btn"
                onClick={handleUsePhoto}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white text-xs font-bold shadow-xl shadow-emerald-950/60 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Use Photo &amp; Screen Document</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Close Camera Button */}
              <button
                type="button"
                id="preview-close-camera-btn"
                onClick={handleClose}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                Close Camera
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
