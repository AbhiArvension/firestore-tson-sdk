import { describe, it, expect } from 'vitest';
import {
  firestoreToTson,
  tsonToFirestore,
  tsonToFirestoreBatch,
  analyzeTokenSavings,
} from '../src/index.js';

describe('firestore-tson-sdk Unified Bi-directional Pipeline', () => {
  it('should round-trip Firestore DocumentSnapshots: Firestore -> TSON -> Firestore', () => {
    const mockSnapshots = {
      docs: [
        {
          id: 'doc_101',
          data: () => ({ name: 'Abhi Asok', role: 'Architect', createdAt: new Date('2026-08-27T15:45:00.000Z') }),
        },
        {
          id: 'doc_102',
          data: () => ({ name: 'Sarah Chen', role: 'AI Engineer', createdAt: new Date('2026-08-27T15:46:00.000Z') }),
        },
      ],
    };

    // 1. Serialize (Firestore -> TSON Prompt Context)
    const tsonPrompt = firestoreToTson(mockSnapshots, { includeDocId: 'id' });
    expect(tsonPrompt).toContain('name: Abhi Asok, Sarah Chen');

    // 2. Deserialize (TSON -> Firestore Documents)
    const restoredDocs = tsonToFirestore<Array<Record<string, unknown>>>(tsonPrompt);
    expect(restoredDocs[0].name).toBe('Abhi Asok');
    expect(restoredDocs[1].name).toBe('Sarah Chen');
  });

  it('should generate Firestore batch write payload objects', () => {
    const tsonInput = `
id: doc_103, doc_104
name: Elena, David
role: Security Lead, DevOps Lead
`;

    const batch = tsonToFirestoreBatch(tsonInput, { docIdField: 'id' });
    expect(batch).toHaveLength(2);
    expect(batch[0].docId).toBe('doc_103');
    expect(batch[0].data.name).toBe('Elena');
    expect(batch[1].docId).toBe('doc_104');
  });

  it('should calculate dual token savings for Firestore payloads', () => {
    const jsonStr = JSON.stringify([
      { id: 'doc_101', name: 'Abhi', role: 'Architect' },
      { id: 'doc_102', name: 'Sarah', role: 'AI Engineer' },
    ], null, 2);

    const tsonStr = `
id: doc_101, doc_102
name: Abhi, Sarah
role: Architect, AI Engineer
`;

    const savings = analyzeTokenSavings(jsonStr, tsonStr);
    expect(savings.savingsPercentage).toBeGreaterThan(25);
  });
});
