import { FirestoreTsonOptions } from './types.js';
import { unwrapDocumentSnapshot } from './firestore.js';
import { formatPrimitive } from './utils.js';
import { getGlobalSavingsTracker } from './tracker.js';

const DEFAULT_OPTIONS: FirestoreTsonOptions = {
  style: 'tabular',
  omitFields: [],
  includeFields: [],
  formatDates: 'iso',
  includeDocId: 'id',
  stripNulls: false,
  indentSpaces: 2,
  collectionName: 'documents',
  trackSavings: false,
};

/**
 * Converts Firebase Cloud Firestore QuerySnapshot, DocumentSnapshot arrays, or raw Firestore documents into TSON format.
 *
 * @param snapshotOrDocs Firestore QuerySnapshot ({ docs: [...] }), DocumentSnapshot array, or single document.
 * @param options Custom serialization options.
 * @returns Serialized TSON string optimized for LLM token efficiency.
 */
export function firestoreToTson(snapshotOrDocs: unknown, options?: FirestoreTsonOptions): string {
  const opts: FirestoreTsonOptions = { ...DEFAULT_OPTIONS, ...options };

  if (!snapshotOrDocs) return '';

  let docs: unknown[] = [];
  if (typeof snapshotOrDocs === 'object' && snapshotOrDocs !== null && 'docs' in snapshotOrDocs && Array.isArray((snapshotOrDocs as { docs: unknown[] }).docs)) {
    docs = (snapshotOrDocs as { docs: unknown[] }).docs;
  } else if (Array.isArray(snapshotOrDocs)) {
    docs = snapshotOrDocs;
  } else {
    docs = [snapshotOrDocs];
  }

  const unwrappedDocs = docs.map((d) => unwrapDocumentSnapshot(d, opts));
  const sanitizedDocs = unwrappedDocs.map((doc) => filterFields(doc, opts));

  let resultStr = '';
  if (opts.style === 'compact') {
    resultStr = serializeCompact(sanitizedDocs);
  } else {
    resultStr = serializeTabular(sanitizedDocs, opts);
  }

  if (opts.trackSavings) {
    const jsonStr = JSON.stringify(snapshotOrDocs);
    getGlobalSavingsTracker().logConversion(jsonStr, resultStr, docs.length);
  }

  return resultStr;
}

function filterFields(doc: Record<string, unknown>, opts: FirestoreTsonOptions): Record<string, unknown> {
  const omitSet = new Set(opts.omitFields || []);
  const includeSet = opts.includeFields && opts.includeFields.length > 0 ? new Set(opts.includeFields) : null;
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(doc)) {
    if (omitSet.has(key)) continue;
    if (includeSet && !includeSet.has(key)) continue;
    if (val === null && opts.stripNulls) continue;

    result[key] = val;
  }

  return result;
}

function serializeTabular(docs: Record<string, unknown>[], opts: FirestoreTsonOptions): string {
  if (docs.length === 0) return '[]';

  const keySet = new Set<string>();
  for (const doc of docs) {
    for (const key of Object.keys(doc)) {
      keySet.add(key);
    }
  }
  const keys = Array.from(keySet);

  if (keys.length === 0) return '[]';

  const indentSpaces = opts.indentSpaces ?? 2;
  const indent = ' '.repeat(indentSpaces);
  const lines: string[] = [];

  for (const key of keys) {
    const values: string[] = [];
    let isAllPrimitives = true;

    for (const doc of docs) {
      const val = doc[key];
      if (val !== null && typeof val === 'object') {
        isAllPrimitives = false;
        break;
      }
      values.push(formatPrimitive(val));
    }

    if (isAllPrimitives) {
      lines.push(`${key}: ${values.join(', ')}`);
    } else {
      lines.push(`${key}:`);
      for (let i = 0; i < docs.length; i++) {
        const val = docs[i][key];
        lines.push(`${indent}#${i + 1}: ${formatPrimitive(val)}`);
      }
    }
  }

  return lines.join('\n');
}

function serializeCompact(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '[]';
  const keys = Array.from(new Set(data.flatMap(Object.keys)));
  const rows = data.map((doc) =>
    keys.map((k) => (doc[k] === undefined ? '' : String(doc[k]))).join(',')
  );
  return `{@${keys.join(',')}#${data.length}|${rows.join('|')}}`;
}
