import { TsonToFirestoreOptions } from './types.js';
import { getGlobalSavingsTracker } from './tracker.js';

const DEFAULT_OPTIONS: Required<TsonToFirestoreOptions> = {
  docIdField: 'id',
  restoreDates: true,
  castNumbers: true,
  castBooleans: true,
  trackSavings: false,
};

/**
 * Converts a TSON string from an LLM response or file into plain JavaScript Firestore document objects.
 *
 * @param tsonString Input TSON string.
 * @param options Parsing configuration options.
 * @returns Array of parsed Firestore document objects.
 */
export function tsonToFirestore<T = Record<string, unknown>>(
  tsonString: string,
  options?: TsonToFirestoreOptions
): T[] {
  const opts: Required<TsonToFirestoreOptions> = { ...DEFAULT_OPTIONS, ...options };

  if (!tsonString || typeof tsonString !== 'string') {
    return [];
  }

  const trimmed = tsonString.trim();
  let result: Record<string, unknown>[] = [];

  if (trimmed.startsWith('{@') && trimmed.endsWith('}')) {
    result = parseCompactTson(trimmed, opts);
  } else {
    result = parseTabularTson(trimmed, opts);
  }

  const restored = restoreFirestoreTypes(result, opts);

  if (opts.trackSavings) {
    const jsonStr = JSON.stringify(restored, null, 2);
    getGlobalSavingsTracker().logConversion(jsonStr, trimmed, restored.length);
  }

  return restored as T[];
}

function parseCompactTson(input: string, options: Required<TsonToFirestoreOptions>): Record<string, unknown>[] {
  const content = input.slice(2, -1);
  const hashIdx = content.indexOf('#');
  if (hashIdx === -1) return [];

  const keysStr = content.slice(0, hashIdx);
  const rest = content.slice(hashIdx + 1);

  const pipeIdx = rest.indexOf('|');
  if (pipeIdx === -1) return [];

  const keys = keysStr.split(',');
  const rowStrings = rest.slice(pipeIdx + 1).split('|');

  return rowStrings.map((row) => {
    const values = row.split(',');
    const obj: Record<string, unknown> = {};
    keys.forEach((key, idx) => {
      obj[key] = parsePrimitive(values[idx] || '', options);
    });
    return obj;
  });
}

function parseTabularTson(input: string, options: Required<TsonToFirestoreOptions>): Record<string, unknown>[] {
  const lines = input.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const fieldMap: Record<string, unknown[]> = {};
  let maxRows = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const rawVal = trimmed.slice(colonIdx + 1).trim();
    if (!key) continue;

    if (rawVal.includes(',')) {
      const values = rawVal.split(',').map((v) => parsePrimitive(v.trim(), options));
      fieldMap[key] = values;
      maxRows = Math.max(maxRows, values.length);
    } else {
      const val = parsePrimitive(rawVal, options);
      fieldMap[key] = [val];
      maxRows = Math.max(maxRows, 1);
    }
  }

  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < maxRows; i++) {
    const row: Record<string, unknown> = {};
    for (const [key, values] of Object.entries(fieldMap)) {
      row[key] = i < values.length ? values[i] : values[values.length - 1];
    }
    rows.push(row);
  }

  return rows;
}

function parsePrimitive(str: string, options: Required<TsonToFirestoreOptions>): unknown {
  if (str === 'null') return null;

  if (options.castBooleans) {
    if (str === 'true') return true;
    if (str === 'false') return false;
  }

  if (str === '[]') return [];
  if (str === '{}') return {};

  if (options.castNumbers && !isNaN(Number(str)) && str !== '') {
    return Number(str);
  }

  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }

  return str;
}

function restoreFirestoreTypes(
  rows: Record<string, unknown>[],
  options: Required<TsonToFirestoreOptions>
): Record<string, unknown>[] {
  return rows.map((row) => {
    const restored: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      if (typeof val === 'string' && options.restoreDates && isIsoDateString(val)) {
        restored[key] = new Date(val);
      } else {
        restored[key] = val;
      }
    }
    return restored;
  });
}

function isIsoDateString(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(str);
}

/**
 * Converts TSON string into array of Firestore write operations ({ docId, data }).
 */
export function tsonToFirestoreBatch(
  tsonString: string,
  options?: TsonToFirestoreOptions
): Array<{ docId?: string; data: Record<string, unknown> }> {
  const opts = { docIdField: 'id', ...options };
  const docs = tsonToFirestore(tsonString, opts);

  return docs.map((doc) => {
    const docData = { ...doc };
    let docId: string | undefined;

    if (opts.docIdField && opts.docIdField in docData) {
      docId = String(docData[opts.docIdField]);
      delete docData[opts.docIdField];
    }

    return { docId, data: docData };
  });
}
