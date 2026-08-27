/**
 * Options for configuring Firestore to TSON serialization (Read Path).
 */
export interface FirestoreTsonOptions {
  /**
   * Output style for TSON.
   * - 'tabular': Human and LLM readable indented columnar format.
   * - 'compact': Pipe-delimited ultra-compact representation.
   * @default 'tabular'
   */
  style?: 'tabular' | 'compact';

  /**
   * Fields to omit from serialization.
   */
  omitFields?: string[];

  /**
   * Fields to exclusively include.
   */
  includeFields?: string[];

  /**
   * Format for Firestore Timestamps.
   * - 'iso': ISO 8601 string
   * - 'timestamp': Milliseconds since epoch
   * @default 'iso'
   */
  formatDates?: 'iso' | 'timestamp';

  /**
   * If true, includes the document ID in output under the specified key name (or 'id').
   * @default 'id'
   */
  includeDocId?: boolean | string;

  /**
   * If true, omits null fields.
   * @default false
   */
  stripNulls?: boolean;

  /**
   * Indentation space count for tabular mode.
   * @default 2
   */
  indentSpaces?: number;

  /**
   * Collection header label.
   * @default 'documents'
   */
  collectionName?: string;

  /**
   * If true, automatically updates SAVINGS_TRACKER.json with cumulative token savings.
   * @default false
   */
  trackSavings?: boolean;
}

/**
 * Options for parsing TSON strings back into Firestore document objects (Write Path).
 */
export interface TsonToFirestoreOptions {
  /**
   * Primary key field in TSON object to use as document ID (e.g. 'id' or '_id').
   * @default 'id'
   */
  docIdField?: string;

  /**
   * If true, attempts to reconstruct Date objects from ISO 8601 strings.
   * @default true
   */
  restoreDates?: boolean;

  /**
   * If true, converts numeric strings back into numbers.
   * @default true
   */
  castNumbers?: boolean;

  /**
   * If true, converts 'true' and 'false' strings to boolean primitives.
   * @default true
   */
  castBooleans?: boolean;

  /**
   * If true, automatically updates SAVINGS_TRACKER.json with cumulative token savings.
   * @default false
   */
  trackSavings?: boolean;
}

/**
 * Result object for token savings analysis.
 */
export interface TokenSavingsAnalysis {
  jsonCharCount: number;
  tsonCharCount: number;
  jsonEstimatedTokens: number;
  tsonEstimatedTokens: number;
  savedTokens: number;
  savingsPercentage: number;
}
