/**
 * firestore-tson-sdk
 * Complete Bi-directional Firebase Cloud Firestore <-> TSON (Token-Structured Object Notation) converter & query payload generator SDK for LLMs.
 *
 * @author Abhi Asok <abhiasok@rocketmail.com>
 * @see https://www.linkedin.com/in/abhi-asok-09439788/
 * @contact +91 9142125724
 */

// Read Path: Firestore -> TSON
export { firestoreToTson } from './serializer.js';
export { unwrapDocumentSnapshot, unwrapFirestoreValue, isDocumentSnapshot, isFirestoreTimestamp } from './firestore.js';

// Write Path: TSON -> Firestore
export { tsonToFirestore, tsonToFirestoreBatch } from './parser.js';

// Token Analytics & Tracker
export { analyzeTokenSavings, estimateTokens } from './utils.js';
export { TokenTracker, getGlobalSavingsTracker } from './tracker.js';

// Type Exports
export type {
  FirestoreTsonOptions,
  TsonToFirestoreOptions,
  TokenSavingsAnalysis,
} from './types.js';
export type { TrackerData } from './tracker.js';
