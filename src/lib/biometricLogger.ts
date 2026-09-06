/**
 * Biometric Verification Development & Diagnostics Logger.
 * Strictly logs non-sensitive diagnostics only in development mode.
 * Sanitizes and suppresses sensitive raw biometric payloads in production.
 */

const IS_DEV =
  typeof window !== 'undefined'
    ? (import.meta as any).env?.DEV ?? true
    : process.env.NODE_ENV !== 'production';

export const biometricLog = {
  cameraPermission: (status: 'requested' | 'granted' | 'denied', err?: any) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    if (status === 'denied') {
      console.warn(`[${time}] [Biometrics:Camera] Permission DENIED:`, err?.message || err);
    } else {
      console.log(`[${time}] [Biometrics:Camera] Permission ${status.toUpperCase()}`);
    }
  },

  cameraStream: (action: 'started' | 'stopped', details?: { label?: string; width?: number; height?: number }) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    console.log(`[${time}] [Biometrics:Stream] Camera stream ${action.toUpperCase()}`, details ? details : '');
  },

  videoReadyState: (state: number, dims: { width: number; height: number }) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    console.log(`[${time}] [Biometrics:Video] Video readyState=${state} (${dims.width}x${dims.height}px)`);
  },

  modelLoading: (status: 'started' | 'completed' | 'failed', err?: any) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    if (status === 'failed') {
      console.error(`[${time}] [Biometrics:Model] Model loading FAILED:`, err);
    } else {
      console.log(`[${time}] [Biometrics:Model] Model initialization ${status.toUpperCase()}`);
    }
  },

  faceDetection: (result: {
    status: string;
    faceCount: number;
    canProceed: boolean;
    reason?: string;
  }) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    console.debug(
      `[${time}] [Biometrics:FaceDetection] Status: ${result.status} (Count: ${result.faceCount}, Allowed: ${result.canProceed})`
    );
  },

  captureTriggered: (info: { width: number; height: number; faceDetected: boolean }) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    console.log(`[${time}] [Biometrics:Capture] Face capture frame captured (${info.width}x${info.height}px, faceVerified=${info.faceDetected})`);
  },

  livenessChallenge: (step: string, instruction: string, progress: number) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    console.log(`[${time}] [Biometrics:Liveness] Challenge: '${step}' (${progress}%) - '${instruction}'`);
  },

  livenessResult: (status: string, score: number, details?: string) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    console.log(`[${time}] [Biometrics:Liveness] Verification RESULT: ${status} (Score: ${score}/100) ${details ? `[${details}]` : ''}`);
  },

  faceMatchResult: (status: string, score: number, confidence: number) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    console.log(`[${time}] [Biometrics:Match] Face Match RESULT: ${status} (Score: ${score}%, Confidence: ${confidence}%)`);
  },

  apiError: (endpoint: string, err: any) => {
    if (!IS_DEV) return;
    const time = new Date().toISOString().substring(11, 23);
    console.error(`[${time}] [Biometrics:API] Error calling ${endpoint}:`, err?.message || err);
  },
};
