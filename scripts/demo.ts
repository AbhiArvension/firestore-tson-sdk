import {
  firestoreToTson,
  tsonToFirestore,
  tsonToFirestoreBatch,
  getGlobalSavingsTracker,
} from '../src/index.js';

console.log('===========================================================');
console.log('🚀 FIRESTORE-TSON-SDK UNIFIED BI-DIRECTIONAL DEMO & TRACKER');
console.log('===========================================================\n');

// 1. Mock Firebase Firestore QuerySnapshot
const mockQuerySnapshot = {
  empty: false,
  size: 2,
  docs: [
    {
      id: 'usr_101',
      data: () => ({
        first_name: 'Abhi',
        last_name: 'Asok',
        email: 'abhiasok@rocketmail.com',
        role: 'Lead Architect',
        active: true,
        createdAt: { toDate: () => new Date('2026-08-27T15:45:00.000Z') },
      }),
    },
    {
      id: 'usr_102',
      data: () => ({
        first_name: 'Sarah',
        last_name: 'Chen',
        email: 'sarah.chen@example.com',
        role: 'Senior AI Engineer',
        active: true,
        createdAt: { toDate: () => new Date('2026-08-27T15:46:12.000Z') },
      }),
    },
  ],
};

const tracker = getGlobalSavingsTracker();

// 2. Read Path: Firestore QuerySnapshot -> TSON (Cuts Input Tokens by 50%)
const promptTson = firestoreToTson(mockQuerySnapshot, { trackSavings: true, includeDocId: 'id' });
console.log('1️⃣ READ PATH (Firestore QuerySnapshot -> TSON Prompt Context):');
console.log(promptTson);
console.log('\n-----------------------------------------------------------');

// 3. Write Path: LLM TSON Response -> Parsed Firestore Document Objects
const llmTsonResponse = `
id: usr_103, usr_104
first_name: Elena, David
last_name: Rostova, Kim
email: elena@example.com, david@example.com
role: Security Engineer, DevOps Lead
active: true, true
`;

const parsedDocs = tsonToFirestore(llmTsonResponse, { trackSavings: true });
console.log('2️⃣ WRITE PATH (LLM TSON Response -> Parsed Firestore Documents):');
console.log(parsedDocs);
console.log('\n-----------------------------------------------------------');

// 4. Firestore Batch Write Objects Generator
const batchOperations = tsonToFirestoreBatch(llmTsonResponse, { docIdField: 'id' });
console.log('3️⃣ GENERATED FIRESTORE BATCH WRITE PAYLOADS:');
console.log(batchOperations);
console.log('\n-----------------------------------------------------------');

// 5. Cumulative Tracker Stats
console.log('💾 CUMULATIVE TRACKER METRICS (SAVINGS_TRACKER.json):');
const stats = tracker.getStats();
console.table({
  'Total Conversions Executed': stats.totalConversions,
  'Equivalent JSON Tokens': stats.totalJsonTokens,
  'Actual TSON Tokens': stats.totalTsonTokens,
  'Total Tokens Saved Overall': stats.totalSavedTokens,
  'Overall Savings Percentage': `${stats.overallSavingsPercentage}%`,
  'Last Updated Timestamp': stats.lastUpdated,
});

console.log('\n✅ Verification Complete! Check SAVINGS_TRACKER.json in project root.');
