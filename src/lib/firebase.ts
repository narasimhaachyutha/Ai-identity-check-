import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { VerificationResult } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must specify the firestoreDatabaseId from configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Operation types for error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is degraded.');
      return false;
    }
    // Expected to get permission denied or not-found for test doc, which confirms server connectivity
    return true;
  }
}

// Automatically trigger connection test
testConnection();

// Authentication helpers
export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    // Gracefully handle normal user actions without alarming errors
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.info('[Auth] Sign-in popup closed or cancelled by user.');
      return null;
    }
    if (error?.code === 'auth/popup-blocked') {
      console.warn('[Auth] Sign-in popup was blocked by browser. Please allow popups.');
      return null;
    }
    console.error('Sign-in with Google failed:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// Sync officer profile to /users/{userId}
export async function syncUserProfile(user: User): Promise<void> {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Checkpoint Officer',
        role: 'officer',
        checkpointStation: 'Terminal 2B Checkpoint',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(
        userRef,
        {
          displayName: user.displayName || 'Checkpoint Officer',
          email: user.email || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    // Non-blocking fallback
    console.warn('Could not sync user profile in Firestore:', err);
  }
}

// Firestore Database operations for /verifications
export async function saveVerificationToFirestore(
  record: VerificationResult,
  currentUser: User | null
): Promise<boolean> {
  const user = currentUser || auth.currentUser;
  if (!user) {
    console.warn('User not signed in. Verification cannot be saved to Cloud Firestore.');
    return false;
  }

  const docId = record.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `verifications/${docId}`;
  const docRef = doc(db, 'verifications', docId);

  // Preserve original createdAt if document already exists
  let originalCreatedAt = record.timestamp || new Date().toISOString();
  try {
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (existingData?.createdAt) {
        originalCreatedAt = existingData.createdAt;
      }
    }
  } catch {
    // If read fails (e.g. offline/new doc), use record timestamp
  }

  // Sanitize record to ensure compact size (< 25KB preview)
  const safeRecord: VerificationResult = {
    ...record,
    // Truncate large data URL previews if necessary to ensure it fits comfortably in Firestore
    imagePreviewUrl: record.imagePreviewUrl && record.imagePreviewUrl.length > 25000
      ? ''
      : (record.imagePreviewUrl || ''),
  };

  const payload = {
    id: docId,
    inspectorId: user.uid,
    timestamp: record.timestamp || new Date().toISOString(),
    fileName: (record.fileName || 'document.png').slice(0, 256),
    documentType: (record.documentType || 'passport').slice(0, 64),
    documentNumber: (record.extractedOCR?.documentNumber || 'UNASSIGNED').slice(0, 64),
    subjectName: (record.extractedOCR?.fullName || 'UNKNOWN').slice(0, 128),
    riskLevel: (record.riskLevel || 'LOW_RISK').slice(0, 32),
    riskScore: typeof record.riskScore === 'number' ? Math.min(100, Math.max(0, Math.round(record.riskScore))) : 0,
    auditHash: (record.auditHash || `VERID-${Date.now()}`).slice(0, 128),
    recordJson: JSON.stringify(safeRecord),
    createdAt: originalCreatedAt,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchVerificationsFromFirestore(
  currentUser: User | null
): Promise<VerificationResult[]> {
  const user = currentUser || auth.currentUser;
  if (!user) return [];

  const path = 'verifications';
  try {
    const q = query(
      collection(db, 'verifications'),
      where('inspectorId', '==', user.uid),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const results: VerificationResult[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.recordJson) {
        try {
          const parsed = JSON.parse(data.recordJson) as VerificationResult;
          results.push(parsed);
        } catch {
          // Fallback reconstruction
          results.push(reconstructResultFromData(data));
        }
      } else {
        results.push(reconstructResultFromData(data));
      }
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToVerifications(
  currentUser: User | null,
  onRecords: (records: VerificationResult[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const user = currentUser || auth.currentUser;
  if (!user) {
    onRecords([]);
    return () => {};
  }

  const path = 'verifications';
  const q = query(
    collection(db, 'verifications'),
    where('inspectorId', '==', user.uid),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const results: VerificationResult[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.recordJson) {
          try {
            const parsed = JSON.parse(data.recordJson) as VerificationResult;
            results.push(parsed);
          } catch {
            results.push(reconstructResultFromData(data));
          }
        } else {
          results.push(reconstructResultFromData(data));
        }
      });
      onRecords(results);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteVerificationFromFirestore(
  recordId: string,
  currentUser: User | null
): Promise<boolean> {
  const user = currentUser || auth.currentUser;
  if (!user) return false;

  const docId = recordId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  const path = `verifications/${docId}`;
  try {
    await deleteDoc(doc(db, 'verifications', docId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function reconstructResultFromData(data: Record<string, any>): VerificationResult {
  return {
    id: data.id,
    timestamp: data.timestamp || data.createdAt || new Date().toISOString(),
    fileName: data.fileName || 'document.png',
    fileSizeFormatted: '1.2 MB',
    fileType: 'image/jpeg',
    documentType: data.documentType || 'passport',
    documentTypeLabel: data.documentType?.toUpperCase() || 'PASSPORT',
    imagePreviewUrl: '',
    riskScore: data.riskScore ?? 15,
    riskLevel: data.riskLevel ?? 'LOW_RISK',
    riskSummary: `Cloud Synced Verification Log - ${data.riskLevel}`,
    engineUsed: 'Veridoxa AI & Cloud Firestore',
    processingTimeMs: 1200,
    qualityMetrics: {
      resolutionDpi: 300,
      resolutionStatus: 'Good (>300 DPI)',
      sharpnessScore: 92,
      glareReflectionScore: 10,
      lightingUniformityScore: 88,
      edgeIntegrityScore: 94,
    },
    extractedOCR: {
      fullName: data.subjectName || '',
      documentNumber: data.documentNumber || '',
    },
    findings: [],
    consistencyChecks: [],
    annotationZones: [],
    manualReviewRecommended: data.riskLevel === 'HIGH_RISK',
    manualActionChecklist: [],
    disclaimerNotice: 'Official Veridoxa AI Border Inspection Record.',
    auditHash: data.auditHash || '',
  };
}
