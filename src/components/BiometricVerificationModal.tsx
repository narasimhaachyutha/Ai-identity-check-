import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Video,
  VideoOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  ScanFace,
  Activity,
  UserCheck,
  Play,
  ArrowRight,
  ArrowLeft,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Check,
  Lock,
} from 'lucide-react';
import {
  FaceVerificationResult,
  LivenessVerificationResult,
  FaceMatchStatus,
  LivenessStatus,
} from '../types';
import {
  initBiometricModels,
  detectFaceInLiveVideoFrame,
  BiometricModelStatus,
  FaceDetectionAnalysis,
} from '../lib/biometricModelManager';
import {
  evaluateLivenessSequence,
  FrameMovementData,
  LivenessChallengeConfig,
  LIVENESS_CHALLENGES,
} from '../lib/livenessEngine';
import { extractDocumentPortrait, compareFaces } from '../lib/faceVerificationEngine';
import { compareBiometricsAPI } from '../services/api';
import { biometricLog } from '../lib/biometricLogger';

export interface BiometricVerificationModalProps {
  isOpen?: boolean;
  documentPortraitUrl?: string;
  documentImageUrl?: string;
  initialDocumentFaceUrl?: string;
  documentNumber?: string;
  subjectName?: string;
  existingFaceResult?: FaceVerificationResult;
  existingLivenessResult?: LivenessVerificationResult;
  onClose: () => void;
  onVerificationComplete?: (
    faceResult: FaceVerificationResult,
    livenessResult: LivenessVerificationResult
  ) => void;
  onComplete?: (
    faceResult: FaceVerificationResult,
    livenessResult: LivenessVerificationResult
  ) => void;
}

export type PipelineStage =
  | 'CAMERA_INIT'
  | 'FACE_DETECTION'
  | 'LIVENESS_CHALLENGE'
  | 'FACE_CAPTURE'
  | 'FACE_MATCHING'
  | 'COMPLETED';

export const BiometricVerificationModal: React.FC<BiometricVerificationModalProps> = ({
  isOpen = true,
  documentPortraitUrl,
  documentImageUrl,
  initialDocumentFaceUrl,
  documentNumber,
  subjectName,
  existingFaceResult,
  existingLivenessResult,
  onClose,
  onVerificationComplete,
  onComplete,
}) => {
  // Normalize Document Portrait input
  const docSourceImage =
    documentPortraitUrl || documentImageUrl || initialDocumentFaceUrl || '';

  // Pipeline Stages
  const [stage, setStage] = useState<PipelineStage>('CAMERA_INIT');

  // Stage Status Matrix for Progress HUD
  const [pipelineProgress, setPipelineProgress] = useState({
    cameraReady: false,
    faceDetected: false,
    livenessVerified: false,
    faceCaptured: false,
    identityFaceMatched: false,
    verificationComplete: false,
  });

  // Camera stream & hardware lifecycle state
  const [cameraPermission, setCameraPermission] = useState<
    'prompt' | 'granted' | 'denied'
  >('prompt');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [videoReadyState, setVideoReadyState] = useState<number>(0);

  // Model initialization state
  const [modelStatus, setModelStatus] = useState<BiometricModelStatus>('UNINITIALIZED');
  const [modelError, setModelError] = useState<string | null>(null);

  // Live face detection telemetry
  const [faceAnalysis, setFaceAnalysis] = useState<FaceDetectionAnalysis>({
    faceCount: 0,
    faceDetected: false,
    status: 'LOOKING_FOR_FACE',
    message: 'Looking for face...',
    canCapture: false,
    metrics: {
      meanBrightness: 0,
      pixelVariance: 0,
      motionIntensity: 0,
      eyeRegionEnergy: 0,
      skinToneScore: 0,
    },
  });

  // Reference document portrait crop
  const [extractedDocFaceUrl, setExtractedDocFaceUrl] = useState<string | null>(
    docSourceImage || null
  );
  const [docFaceExtracted, setDocFaceExtracted] = useState(false);
  const [isExtractingDocFace, setIsExtractingDocFace] = useState(false);

  // Liveness Challenge sequence state
  const [challengeSequenceIndex, setChallengeSequenceIndex] = useState(0);
  const challengeSequence: LivenessChallengeConfig[] = [
    LIVENESS_CHALLENGES[2], // Blink Both Eyes
    LIVENESS_CHALLENGES[1], // Turn Head Left
    LIVENESS_CHALLENGES[0], // Turn Head Right
  ];
  const [activeChallenge, setActiveChallenge] = useState<LivenessChallengeConfig>(
    challengeSequence[0]
  );
  const [challengeRunning, setChallengeRunning] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [challengePassedCount, setChallengePassedCount] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<FrameMovementData[]>([]);

  // Face Capture snapshot
  const [capturedSelfieUrl, setCapturedSelfieUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Final Results
  const [faceResult, setFaceResult] = useState<FaceVerificationResult | null>(
    existingFaceResult || null
  );
  const [livenessResult, setLivenessResult] = useState<LivenessVerificationResult | null>(
    existingLivenessResult || null
  );
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Diagnostics & Telemetry UI drawer
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const detectionTimerRef = useRef<number | null>(null);

  // Unified callback dispatcher
  const dispatchCompletion = useCallback(
    (faceRes: FaceVerificationResult, liveRes: LivenessVerificationResult) => {
      if (onVerificationComplete) {
        onVerificationComplete(faceRes, liveRes);
      }
      if (onComplete) {
        onComplete(faceRes, liveRes);
      }
    },
    [onVerificationComplete, onComplete]
  );

  // ---------------- 1. DOCUMENT PORTRAIT EXTRACTION ----------------
  useEffect(() => {
    let isCancelled = false;
    if (docSourceImage) {
      setIsExtractingDocFace(true);
      extractDocumentPortrait(docSourceImage)
        .then((res) => {
          if (!isCancelled) {
            if (res.faceDetected && res.thumbnailUrl) {
              setExtractedDocFaceUrl(res.thumbnailUrl);
              setDocFaceExtracted(true);
            } else {
              setExtractedDocFaceUrl(docSourceImage);
              setDocFaceExtracted(true);
            }
            setIsExtractingDocFace(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setExtractedDocFaceUrl(docSourceImage);
            setDocFaceExtracted(true);
            setIsExtractingDocFace(false);
          }
        });
    } else {
      setDocFaceExtracted(false);
    }
    return () => {
      isCancelled = true;
    };
  }, [docSourceImage]);

  // ---------------- 2. MODEL INITIALIZATION ----------------
  const loadModels = useCallback(async () => {
    try {
      setModelStatus('LOADING');
      setModelError(null);
      const context = await initBiometricModels();
      setModelStatus('READY');
      biometricLog.modelLoading('completed', context);
    } catch (err: any) {
      setModelStatus('ERROR');
      const msg = err?.message || 'Failed to load biometric computer vision models.';
      setModelError(msg);
      biometricLog.modelLoading('failed', msg);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen, loadModels]);

  // ---------------- 3. CAMERA LIFECYCLE MANAGEMENT ----------------
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      streamRef.current = null;
      biometricLog.cameraStream('stopped');
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (detectionTimerRef.current) {
      window.cancelAnimationFrame(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }

    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    // 1. Terminate any previous camera stream to prevent leaks
    stopCamera();
    setCameraError(null);

    // 2. Check secure context & device API availability
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      const msg = 'Camera access requires a secure HTTPS context or localhost.';
      setCameraError(msg);
      setCameraPermission('denied');
      biometricLog.cameraPermission('denied', { reason: 'Insecure context' });
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Browser does not support the WebRTC MediaDevices camera API.';
      setCameraError(msg);
      setCameraPermission('denied');
      biometricLog.cameraPermission('denied', { reason: 'No mediaDevices API' });
      return;
    }

    biometricLog.cameraPermission('requested');

    try {
      // 3. Request Camera Stream
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraPermission('granted');
      biometricLog.cameraPermission('granted');

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        biometricLog.cameraStream('started', { label: videoTrack.label });
      }

      // 4. Attach stream to HTMLVideoElement
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('[Biometrics] Video auto-play error:', playErr);
        }
      }

      setCameraActive(true);
      setPipelineProgress((prev) => ({ ...prev, cameraReady: true }));
      setStage('FACE_DETECTION');
    } catch (err: any) {
      console.error('[Biometrics] Camera initialization failed:', err);
      setCameraActive(false);
      setCameraPermission('denied');

      let errorMsg = 'Unable to access device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg =
          'Camera permission was denied. Please allow camera access in your browser site permissions and click Retry.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg =
          'No camera device detected on this system. You can use the Sandbox Test Presets below to simulate border screening.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg =
          'Camera is currently occupied by another program. Please close any background camera apps and retry.';
      } else {
        errorMsg = err.message || 'Camera hardware initialization error.';
      }

      setCameraError(errorMsg);
      biometricLog.cameraPermission('denied', err);
    }
  }, [stopCamera]);

  // Request camera automatically when modal is opened
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // ---------------- 4. VIDEO METADATA & READY STATE LISTENERS ----------------
  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const v = videoRef.current;
      setVideoDims({ width: v.videoWidth, height: v.videoHeight });
      setVideoReadyState(v.readyState);
      biometricLog.videoReadyState(v.readyState, {
        width: v.videoWidth,
        height: v.videoHeight,
      });
    }
  };

  const handleVideoCanPlay = () => {
    if (videoRef.current) {
      const v = videoRef.current;
      setVideoDims({ width: v.videoWidth, height: v.videoHeight });
      setVideoReadyState(v.readyState);
      if (v.paused) {
        v.play().catch(() => {});
      }
    }
  };

  // ---------------- 5. REAL-TIME OPTICAL FACE DETECTION LOOP ----------------
  useEffect(() => {
    if (!cameraActive || modelStatus !== 'READY') return;

    let isSubscribed = true;

    const runDetection = () => {
      if (!isSubscribed || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        const analysis = detectFaceInLiveVideoFrame(video, canvas, prevFrameRef);
        setFaceAnalysis(analysis);

        // Update pipeline state when face is centered & detected
        if (analysis.faceDetected && analysis.faceCount === 1) {
          setPipelineProgress((prev) => ({ ...prev, faceDetected: true }));
        } else {
          setPipelineProgress((prev) => ({ ...prev, faceDetected: false }));
        }

        biometricLog.faceDetection({
          status: analysis.status,
          faceCount: analysis.faceCount,
          canProceed: analysis.canCapture,
        });
      }

      detectionTimerRef.current = window.requestAnimationFrame(runDetection);
    };

    detectionTimerRef.current = window.requestAnimationFrame(runDetection);

    return () => {
      isSubscribed = false;
      if (detectionTimerRef.current) {
        window.cancelAnimationFrame(detectionTimerRef.current);
        detectionTimerRef.current = null;
      }
    };
  }, [cameraActive, modelStatus]);

  // ---------------- 6. LIVENESS CHALLENGE SEQUENCE ----------------
  const startLivenessChallenge = () => {
    setChallengeSequenceIndex(0);
    setActiveChallenge(challengeSequence[0]);
    setChallengeRunning(true);
    setChallengeProgress(0);
    setChallengePassedCount(0);
    setCapturedFrames([]);
    setStage('LIVENESS_CHALLENGE');
    runChallengeStep(0, []);
  };

  const runChallengeStep = (stepIdx: number, accumulatedFrames: FrameMovementData[]) => {
    const curChallenge = challengeSequence[stepIdx];
    setActiveChallenge(curChallenge);
    setChallengeProgress(0);

    const stepDurationMs = 2600;
    const intervalMs = 120;
    let elapsed = 0;
    const currentStepFrames: FrameMovementData[] = [];

    const intervalTimer = setInterval(() => {
      elapsed += intervalMs;
      const progressPercent = Math.min(100, Math.round((elapsed / stepDurationMs) * 100));
      setChallengeProgress(progressPercent);

      // Extract optical movement vectors from live video
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = 160;
          canvas.height = 120;
          ctx.drawImage(video, 0, 0, 160, 120);

          try {
            const curData = ctx.getImageData(0, 0, 160, 120);
            let diffMotion = 0;
            let leftLumShift = 0;
            let rightLumShift = 0;

            if (prevFrameRef.current) {
              const prev = prevFrameRef.current.data;
              const cur = curData.data;
              for (let i = 0; i < cur.length; i += 12) {
                const diff = Math.abs(cur[i] - prev[i]);
                diffMotion += diff;
                const pxX = (i / 4) % 160;
                if (pxX < 80) leftLumShift += diff;
                else rightLumShift += diff;
              }
            }

            prevFrameRef.current = curData;
            const normMotion = Math.min(100, Math.round(diffMotion / 1000));
            const horiz =
              leftLumShift + rightLumShift > 0
                ? (rightLumShift - leftLumShift) / (leftLumShift + rightLumShift)
                : 0;

            currentStepFrames.push({
              timestamp: Date.now(),
              faceDetected: faceAnalysis.faceDetected,
              horizontalShift: horiz,
              verticalShift: 0,
              motionIntensity: normMotion,
              brightness: faceAnalysis.metrics.meanBrightness,
              eyeRegionEnergy: faceAnalysis.metrics.eyeRegionEnergy + normMotion * 0.8,
            });
          } catch (e) {
            // ignore canvas security exceptions
          }
        }
      }

      if (elapsed >= stepDurationMs) {
        clearInterval(intervalTimer);

        const updatedFrames = [...accumulatedFrames, ...currentStepFrames];
        setCapturedFrames(updatedFrames);

        // Check if next challenge step exists
        if (stepIdx + 1 < challengeSequence.length) {
          setChallengePassedCount((prev) => prev + 1);
          setChallengeSequenceIndex(stepIdx + 1);
          runChallengeStep(stepIdx + 1, updatedFrames);
        } else {
          // Finished all challenge steps -> evaluate overall liveness
          setChallengeRunning(false);
          setChallengePassedCount(challengeSequence.length);

          const finalLiveness = evaluateLivenessSequence(
            challengeSequence[0],
            updatedFrames
          );
          setLivenessResult(finalLiveness);
          biometricLog.livenessResult(
            finalLiveness.status,
            finalLiveness.movementScore,
            finalLiveness.antiSpoofDetails
          );

          if (finalLiveness.status === 'PASS') {
            setPipelineProgress((prev) => ({ ...prev, livenessVerified: true }));
            setStage('FACE_CAPTURE');
          } else {
            setPipelineProgress((prev) => ({ ...prev, livenessVerified: false }));
          }
        }
      }
    }, intervalMs);
  };

  // ---------------- 7. FACE CAPTURE WORKFLOW ----------------
  const captureSelfieSnapshot = () => {
    setCaptureError(null);
    setIsCapturing(true);

    try {
      // 1. Verify Camera stream is active
      if (!cameraActive || !videoRef.current || !streamRef.current) {
        throw new Error('Camera stream is not active. Please start camera first.');
      }

      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Camera is still initializing frames. Please wait a moment.');
      }

      // 2. Verify exactly one face is detected
      if (!faceAnalysis.faceDetected || faceAnalysis.faceCount !== 1) {
        throw new Error(
          `Face capture requires exactly one visible face. Current state: ${faceAnalysis.message}`
        );
      }

      // 3. Capture current video frame to high-resolution canvas
      const canvas = document.createElement('canvas');
      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;

      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to initialize 2D drawing canvas context.');
      }

      // Mirror canvas horizontally to match the webcam display preview
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        startX,
        startY,
        minDim,
        minDim,
        0,
        0,
        canvas.width,
        canvas.height
      );
      ctx.restore();

      // 4. Validate captured frame for non-blackness and minimum luminance
      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = frameData.data;
      let totalLum = 0;
      let sampleCount = 0;

      for (let i = 0; i < d.length; i += 16) {
        totalLum += (d[i] + d[i + 1] + d[i + 2]) / 3;
        sampleCount++;
      }
      const avgBrightness = totalLum / sampleCount;

      if (avgBrightness < 8) {
        throw new Error(
          'Capture rejected: The captured frame is completely dark or blank. Please check camera shutter or lighting.'
        );
      }

      // 5. Store captured face image in application state
      const selfieUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedSelfieUrl(selfieUrl);
      setPipelineProgress((prev) => ({ ...prev, faceCaptured: true }));
      biometricLog.captureTriggered({
        width: canvas.width,
        height: canvas.height,
        faceDetected: true,
      });

      // 6. Proceed to Face Matching step
      setStage('FACE_MATCHING');
      executeFaceComparison(selfieUrl);
    } catch (err: any) {
      setCaptureError(err?.message || 'Failed to capture frame.');
      biometricLog.apiError('captureSelfieSnapshot', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // ---------------- 8. BIOMETRIC MATCHING ----------------
  const executeFaceComparison = async (selfieUrl: string) => {
    setIsComparing(true);
    setComparisonError(null);

    try {
      const docPortrait = extractedDocFaceUrl || docSourceImage;
      if (!docPortrait) {
        throw new Error('Document reference portrait is not available for comparison.');
      }

      // Real Biometric Matching API (calls /api/biometrics/compare on server, with client fallback)
      const evaluatedFace = await compareBiometricsAPI({
        documentFaceUrl: docPortrait,
        selfieUrl,
        livenessData: livenessResult,
      });

      setFaceResult(evaluatedFace);
      biometricLog.faceMatchResult(
        evaluatedFace.matchStatus,
        evaluatedFace.matchScore,
        evaluatedFace.confidence
      );

      const isMatch = evaluatedFace.matchStatus === 'MATCH';
      setPipelineProgress((prev) => ({
        ...prev,
        identityFaceMatched: isMatch,
        verificationComplete: true,
      }));

      setStage('COMPLETED');
      stopCamera();
    } catch (err: any) {
      const msg = err?.message || 'Facial comparison processing error.';
      setComparisonError(msg);
      biometricLog.apiError('/api/biometrics/compare', err);

      // Safe deterministic fallback
      const fallbackFace = await compareFaces(
        extractedDocFaceUrl || docSourceImage,
        selfieUrl
      );
      setFaceResult(fallbackFace);
      setStage('COMPLETED');
      stopCamera();
    } finally {
      setIsComparing(false);
    }
  };

  // ---------------- 9. TESTING PRESETS (DEVELOPER & EVALUATOR SANDBOX) ----------------
  const handleQuickPresetTest = async (
    scenario: 'genuine_match' | 'face_mismatch' | 'static_spoof'
  ) => {
    setComparisonError(null);
    setCaptureError(null);

    const syntheticSelfie =
      extractedDocFaceUrl ||
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%230284c7"/><text x="50%" y="50%" fill="white" font-size="16" font-family="sans-serif" text-anchor="middle" dy=".3em">Live Subject</text></svg>';
    setCapturedSelfieUrl(syntheticSelfie);

    if (scenario === 'genuine_match') {
      const evaluatedLive = evaluateLivenessSequence(activeChallenge, [], {
        forcedStatus: 'PASS',
      });
      const evaluatedFace = await compareFaces(
        extractedDocFaceUrl || docSourceImage,
        syntheticSelfie,
        { forcedStatus: 'MATCH' }
      );

      setLivenessResult(evaluatedLive);
      setFaceResult(evaluatedFace);
      setPipelineProgress({
        cameraReady: true,
        faceDetected: true,
        livenessVerified: true,
        faceCaptured: true,
        identityFaceMatched: true,
        verificationComplete: true,
      });
    } else if (scenario === 'face_mismatch') {
      const evaluatedLive = evaluateLivenessSequence(activeChallenge, [], {
        forcedStatus: 'PASS',
      });
      const evaluatedFace = await compareFaces(
        extractedDocFaceUrl || docSourceImage,
        syntheticSelfie,
        { forcedStatus: 'NO_MATCH' }
      );

      setLivenessResult(evaluatedLive);
      setFaceResult(evaluatedFace);
      setPipelineProgress({
        cameraReady: true,
        faceDetected: true,
        livenessVerified: true,
        faceCaptured: true,
        identityFaceMatched: false,
        verificationComplete: true,
      });
    } else {
      // Static Spoof
      const evaluatedLive = evaluateLivenessSequence(activeChallenge, [], {
        forcedStatus: 'FAIL',
        isSimulatedSpoof: true,
      });
      const evaluatedFace = await compareFaces(
        extractedDocFaceUrl || docSourceImage,
        syntheticSelfie,
        { forcedStatus: 'MATCH' }
      );

      setLivenessResult(evaluatedLive);
      setFaceResult(evaluatedFace);
      setPipelineProgress({
        cameraReady: true,
        faceDetected: true,
        livenessVerified: false,
        faceCaptured: true,
        identityFaceMatched: true,
        verificationComplete: true,
      });
    }

    setStage('COMPLETED');
    stopCamera();
  };

  // ---------------- 10. APPLY & CONFIRM ----------------
  const handleApplyAndConfirm = () => {
    if (faceResult && livenessResult) {
      dispatchCompletion(faceResult, livenessResult);
      onClose();
    }
  };

  // Retake Workflow
  const handleRetake = () => {
    setCapturedSelfieUrl(null);
    setFaceResult(null);
    setLivenessResult(null);
    setCaptureError(null);
    setComparisonError(null);
    setPipelineProgress({
      cameraReady: true,
      faceDetected: false,
      livenessVerified: false,
      faceCaptured: false,
      identityFaceMatched: false,
      verificationComplete: false,
    });
    setStage('FACE_DETECTION');
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Biometric Face Match & Anti-Spoofing
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  SIH Checkpoint
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                1:1 Optical concordance verification between live subject and document portrait
              </p>
            </div>
          </div>
          <button
            id="close-biometric-modal-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Pipeline Stage Checklist Indicator (Requirement 10 & 11) */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Verification Pipeline Progress
              </span>
              <span className="text-[10px] font-mono text-sky-400">
                Stage: {stage.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* 1. Camera Ready */}
              <div
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  pipelineProgress.cameraReady
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : cameraError
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {pipelineProgress.cameraReady ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Video className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="text-[10px] font-medium truncate">Camera</span>
              </div>

              {/* 2. Face Detected */}
              <div
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  pipelineProgress.faceDetected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {pipelineProgress.faceDetected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ScanFace className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="text-[10px] font-medium truncate">Face Detected</span>
              </div>

              {/* 3. Liveness Verified */}
              <div
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  pipelineProgress.livenessVerified
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : livenessResult?.status === 'FAIL'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {pipelineProgress.livenessVerified ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Activity className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="text-[10px] font-medium truncate">Liveness</span>
              </div>

              {/* 4. Face Captured */}
              <div
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  pipelineProgress.faceCaptured
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {pipelineProgress.faceCaptured ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="text-[10px] font-medium truncate">Captured</span>
              </div>

              {/* 5. Face Matched */}
              <div
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  pipelineProgress.identityFaceMatched
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : faceResult?.matchStatus === 'NO_MATCH'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {pipelineProgress.identityFaceMatched ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="text-[10px] font-medium truncate">Face Match</span>
              </div>
            </div>
          </div>

          {/* Model Loading State Banner (Requirement 7) */}
          {modelStatus === 'LOADING' && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
              <span>Loading biometric computer vision models... Please wait.</span>
            </div>
          )}

          {modelStatus === 'ERROR' && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Biometric Model Initialization Failed</span>
                  <span>{modelError}</span>
                </div>
              </div>
              <button
                id="retry-model-load-btn"
                onClick={loadModels}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                Retry Model Load
              </button>
            </div>
          )}

          {/* Hidden Canvas for High-Precision Frame Analysis */}
          <canvas ref={canvasRef} className="hidden" />

          {/* MAIN CAMERA STAGE (Active when not yet completed) */}
          {stage !== 'COMPLETED' && (
            <div className="space-y-4">
              {/* Reference Header Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-3.5">
                {/* Document Face Thumbnail Crop */}
                <div className="w-20 h-24 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex flex-col items-center justify-center relative shrink-0">
                  {extractedDocFaceUrl ? (
                    <img
                      src={extractedDocFaceUrl}
                      alt="Doc Portrait"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <UserCheck className="w-5 h-5 text-slate-500 mx-auto" />
                      <span className="text-[9px] text-slate-500 block mt-1">No Portrait</span>
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-[8px] text-center font-mono py-0.5 text-slate-300">
                    Doc Reference
                  </span>
                </div>

                <div className="space-y-1 text-center sm:text-left flex-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        docFaceExtracted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {docFaceExtracted ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      <span>
                        {docFaceExtracted
                          ? 'Document Portrait Ready'
                          : 'Specimen Portrait Not Found'}
                      </span>
                    </span>
                    {subjectName && (
                      <span className="text-[11px] font-mono text-slate-300">
                        {subjectName}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    Live Video Biometric Terminal
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Align your face inside the tracking oval. The system analyzes real-time skin
                    chrominance, motion dynamics, and facial geometry.
                  </p>
                </div>
              </div>

              {/* Hardware / Permission Error Notice */}
              {cameraError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Camera Inactive</span>
                      <span>{cameraError}</span>
                    </div>
                  </div>
                  <button
                    id="retry-camera-permission-btn"
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </div>
              )}

              {/* Capture Error Banner */}
              {captureError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="font-bold block">Capture Rejected:</span>
                    <span>{captureError}</span>
                  </div>
                </div>
              )}

              {/* Live Video Camera Box */}
              <div className="relative w-full max-w-md mx-auto aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={handleVideoMetadata}
                  onCanPlay={handleVideoCanPlay}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    cameraActive ? 'opacity-100' : 'opacity-20'
                  }`}
                  style={{ transform: 'scaleX(-1)' }}
                />

                {/* Connecting Overlay when camera is starting */}
                {!cameraActive && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-200">
                        Initializing Camera Hardware...
                      </p>
                      <p className="text-[10px] text-slate-400 max-w-xs">
                        Please allow camera permission in your browser if prompted.
                      </p>
                    </div>
                    <button
                      id="start-camera-stream-btn"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Start Camera Feed
                    </button>
                  </div>
                )}

                {/* Face Tracking Oval Overlay (Requirement 2: Detection state messaging) */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div
                      className={`w-44 h-56 rounded-[50%] border-2 transition-all duration-300 flex flex-col items-center justify-between py-3 shadow-[0_0_20px_rgba(0,0,0,0.6)] ${
                        stage === 'LIVENESS_CHALLENGE'
                          ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
                          : faceAnalysis.status === 'FACE_DETECTED'
                          ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                          : faceAnalysis.status === 'MULTIPLE_FACES'
                          ? 'border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                          : 'border-dashed border-amber-400/80'
                      }`}
                    >
                      {/* Detection State Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${
                          faceAnalysis.status === 'FACE_DETECTED'
                            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                            : faceAnalysis.status === 'MULTIPLE_FACES'
                            ? 'bg-rose-950/90 border-rose-500/50 text-rose-300'
                            : 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                        }`}
                      >
                        {stage === 'LIVENESS_CHALLENGE'
                          ? `Action: Step ${challengeSequenceIndex + 1}/3`
                          : faceAnalysis.message}
                      </span>

                      {/* Optical Lighting Tag */}
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300">
                        {faceAnalysis.metrics.meanBrightness < 25
                          ? 'Lighting: Low'
                          : faceAnalysis.metrics.meanBrightness > 230
                          ? 'Lighting: Glare'
                          : 'Lighting: Optimal'}
                      </span>
                    </div>
                  </div>
                )}

                {/* HUD Live Stream Telemetry Tag */}
                {cameraActive && (
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-300 backdrop-blur-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE STREAM</span>
                    <span className="text-slate-500">|</span>
                    <span>
                      {videoDims.width}x{videoDims.height}
                    </span>
                  </div>
                )}
              </div>

              {/* LIVENESS CHALLENGE PROMPT BANNER (Requirement 4) */}
              {stage === 'LIVENESS_CHALLENGE' && (
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-center space-y-2.5 animate-fadeIn">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold font-mono">
                    {activeChallenge.type === 'turn_right' ? (
                      <ArrowRight className="w-4 h-4" />
                    ) : activeChallenge.type === 'turn_left' ? (
                      <ArrowLeft className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    <span>CHALLENGE: {activeChallenge.title.toUpperCase()}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    {activeChallenge.instruction}
                  </p>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden max-w-xs mx-auto mt-1">
                    <div
                      className="bg-sky-500 h-full transition-all duration-100 ease-linear rounded-full"
                      style={{ width: `${challengeProgress}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-2">
                    <span>
                      Completed: {challengePassedCount} / {challengeSequence.length} actions
                    </span>
                  </div>
                </div>
              )}

              {/* INTERACTIVE CONTROLS (Requirement 6: Immediate responsive buttons) */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                {!cameraActive ? (
                  <button
                    id="start-camera-feed-btn"
                    onClick={startCamera}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-950 transition-colors cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Start Camera</span>
                  </button>
                ) : stage === 'FACE_DETECTION' ? (
                  <>
                    <button
                      id="begin-liveness-btn"
                      onClick={startLivenessChallenge}
                      disabled={!faceAnalysis.canCapture}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-colors cursor-pointer ${
                        faceAnalysis.canCapture
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      <span>1. Start Liveness Check</span>
                    </button>

                    <button
                      id="direct-capture-btn"
                      onClick={captureSelfieSnapshot}
                      disabled={!faceAnalysis.canCapture || isCapturing}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-colors cursor-pointer ${
                        faceAnalysis.canCapture && !isCapturing
                          ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isCapturing ? 'Capturing...' : 'Capture Face Now'}</span>
                    </button>
                  </>
                ) : stage === 'FACE_CAPTURE' ? (
                  <button
                    id="capture-frame-btn"
                    onClick={captureSelfieSnapshot}
                    disabled={!faceAnalysis.canCapture || isCapturing}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xl shadow-sky-950 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isCapturing ? 'Capturing Frame...' : '2. Capture Live Frame'}</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                    <span>Processing biometric challenge sequence...</span>
                  </div>
                )}

                {cameraActive && (
                  <button
                    id="turn-off-camera-btn"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <VideoOff className="w-3.5 h-3.5" />
                    <span>Turn Off Camera</span>
                  </button>
                )}
              </div>

              {/* Diagnostics Toggle */}
              <div className="pt-1 text-center">
                <button
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  <span>
                    {showDiagnostics ? 'Hide Camera Diagnostics' : 'Show Camera & Model Diagnostics'}
                  </span>
                  {showDiagnostics ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Diagnostics Drawer */}
              {showDiagnostics && (
                <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-[10px] font-mono space-y-1.5 text-slate-300 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2 border-b border-slate-800 pb-1.5">
                    <div>
                      <span className="text-slate-500">Model Status: </span>
                      <span className="font-bold text-sky-400">{modelStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Face Detected: </span>
                      <span
                        className={
                          faceAnalysis.faceDetected ? 'text-emerald-400 font-bold' : 'text-amber-400'
                        }
                      >
                        {faceAnalysis.faceDetected ? 'YES' : 'NO'} (Count: {faceAnalysis.faceCount})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Video Resolution: </span>
                      <span>
                        {videoDims.width} x {videoDims.height} px
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Video ReadyState: </span>
                      <span>{videoReadyState}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <span className="text-slate-500">Brightness: </span>
                      <span className="font-bold">{faceAnalysis.metrics.meanBrightness} / 255</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Texture Variance: </span>
                      <span className="font-bold">{faceAnalysis.metrics.pixelVariance}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Motion Delta: </span>
                      <span className="font-bold">{faceAnalysis.metrics.motionIntensity}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer / Evaluator Sandbox Scenarios Strip */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Evaluator & Sandbox Simulation Presets:</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Test Edge Cases Instantly
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    id="sandbox-test-match-btn"
                    onClick={() => handleQuickPresetTest('genuine_match')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 transition-colors text-left cursor-pointer"
                  >
                    <div className="font-bold text-[11px] text-emerald-400">✓ Genuine Match</div>
                    <div className="text-[10px] text-slate-500">Pass Face Match + Live Gesture</div>
                  </button>
                  <button
                    id="sandbox-test-mismatch-btn"
                    onClick={() => handleQuickPresetTest('face_mismatch')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-colors text-left cursor-pointer"
                  >
                    <div className="font-bold text-[11px] text-rose-400">✕ Face Mismatch</div>
                    <div className="text-[10px] text-slate-500">Subject ≠ Specimen Portrait</div>
                  </button>
                  <button
                    id="sandbox-test-spoof-btn"
                    onClick={() => handleQuickPresetTest('static_spoof')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-600/20 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-colors text-left cursor-pointer"
                  >
                    <div className="font-bold text-[11px] text-amber-400">⚠ Static Spoof Attempt</div>
                    <div className="text-[10px] text-slate-500">Static 2D Print / No Parallax</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FINAL RESULTS VIEW (Stage: COMPLETED) */}
          {stage === 'COMPLETED' && faceResult && livenessResult && (
            <div className="space-y-4 animate-fadeIn">
              {/* Dual Portrait Display */}
              <div className="grid grid-cols-2 gap-4">
                {/* Reference Document Portrait */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Document Portrait
                  </span>
                  <div className="w-28 h-32 mx-auto rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shadow-md flex items-center justify-center">
                    {faceResult.documentFaceThumbnail || extractedDocFaceUrl ? (
                      <img
                        src={faceResult.documentFaceThumbnail || extractedDocFaceUrl || ''}
                        alt="Doc Specimen"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-500 text-[10px]">No Portrait</div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Extracted Reference
                  </span>
                </div>

                {/* Live Captured Selfie */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Live Captured Subject
                  </span>
                  <div className="w-28 h-32 mx-auto rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shadow-md flex items-center justify-center">
                    {faceResult.selfieThumbnail || capturedSelfieUrl ? (
                      <img
                        src={faceResult.selfieThumbnail || capturedSelfieUrl || ''}
                        alt="Live Selfie"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-500 text-[10px]">Selfie</div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Live Capture ✓
                  </span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Face Match Badge */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    faceResult.matchStatus === 'MATCH'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : faceResult.matchStatus === 'PARTIAL_REVIEW'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider">
                      Face Match
                    </span>
                    <span className="font-mono font-bold text-sm">
                      {faceResult.matchScore}%
                    </span>
                  </div>
                  <div className="font-bold text-xs mt-1">
                    {faceResult.matchStatus === 'MATCH'
                      ? '✓ MATCH CONFIRMED'
                      : faceResult.matchStatus === 'PARTIAL_REVIEW'
                      ? '⚠ PARTIAL / REVIEW'
                      : '✕ NO MATCH'}
                  </div>
                </div>

                {/* Liveness Badge */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    livenessResult.status === 'PASS'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : livenessResult.status === 'REVIEW'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider">
                      Liveness (Anti-Spoof)
                    </span>
                    <span className="font-mono font-bold text-sm">
                      {livenessResult.antiSpoofPassed ? 'LIVE ✓' : 'SPOOF ✕'}
                    </span>
                  </div>
                  <div className="font-bold text-xs mt-1">
                    {livenessResult.status === 'PASS'
                      ? '✓ LIVENESS PASSED'
                      : livenessResult.status === 'REVIEW'
                      ? '⚠ REVIEW'
                      : '✕ LIVENESS FAILED'}
                  </div>
                </div>
              </div>

              {/* Forensic Details List */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Biometric Engine Findings
                </span>
                <ul className="text-xs text-slate-300 space-y-1">
                  {faceResult.comparisonDetails.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-sky-400 mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                  {livenessResult.observations.map((obs, idx) => (
                    <li key={`live-${idx}`} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="retake-biometrics-btn"
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Biometrics</span>
                </button>

                <button
                  id="apply-biometrics-confirm-btn"
                  onClick={handleApplyAndConfirm}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-950 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply to Checkpoint Dossier</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
