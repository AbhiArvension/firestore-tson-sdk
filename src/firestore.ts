import { FirestoreTsonOptions } from './types.js';

export function isDocumentSnapshot(val: unknown): boolean {
  if (!val || typeof val !== 'object') return false;
  const obj = val as Record<string, unknown>;
  return typeof obj.data === 'function' && typeof obj.id === 'string';
}

export function isFirestoreTimestamp(val: unknown): boolean {
  if (!val || typeof val !== 'object') return false;
  const obj = val as Record<string, unknown>;
  return typeof obj.toDate === 'function' || (typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number');
}

export function unwrapFirestoreValue(val: unknown, options: FirestoreTsonOptions): unknown {
  if (val === null || val === undefined) {
    return val;
  }

  // Firestore Timestamp
  if (isFirestoreTimestamp(val)) {
    const tsObj = val as { toDate?: () => Date; seconds?: number };
    const date = typeof tsObj.toDate === 'function' ? tsObj.toDate() : new Date((tsObj.seconds || 0) * 1000);
    if (options.formatDates === 'timestamp') {
      return date.getTime();
    }
    return date.toISOString();
  }

  if (val instanceof Date) {
    if (options.formatDates === 'timestamp') {
      return val.getTime();
    }
    return val.toISOString();
  }

  // Firestore GeoPoint
  if (typeof val === 'object' && val !== null && 'latitude' in val && 'longitude' in val) {
    const geo = val as { latitude: number; longitude: number };
    return { lat: geo.latitude, lng: geo.longitude };
  }

  // Firestore DocumentReference
  if (typeof val === 'object' && val !== null && 'path' in val && typeof (val as { path: string }).path === 'string') {
    return `ref:${(val as { path: string }).path}`;
  }

  if (Array.isArray(val)) {
    return val.map((item) => unwrapFirestoreValue(item, options));
  }

  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = unwrapFirestoreValue(v, options);
    }
    return result;
  }

  return val;
}

export function unwrapDocumentSnapshot(doc: unknown, options: FirestoreTsonOptions): Record<string, unknown> {
  if (!doc || typeof doc !== 'object') return {};

  let dataObj: Record<string, unknown> = {};
  let docId = '';

  if (isDocumentSnapshot(doc)) {
    const snap = doc as { id: string; data: () => Record<string, unknown> };
    dataObj = snap.data() || {};
    docId = snap.id;
  } else {
    dataObj = doc as Record<string, unknown>;
    if (typeof dataObj.id === 'string') {
      docId = dataObj.id;
    }
  }

  const unwrapped = unwrapFirestoreValue(dataObj, options) as Record<string, unknown>;

  if (options.includeDocId && docId) {
    const keyName = typeof options.includeDocId === 'string' ? options.includeDocId : 'id';
    return { [keyName]: docId, ...unwrapped };
  }

  return unwrapped;
}
