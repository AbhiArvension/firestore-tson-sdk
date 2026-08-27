import * as fs from 'node:fs';
import * as path from 'node:path';
import { analyzeTokenSavings } from './utils.js';
import { TokenSavingsAnalysis } from './types.js';

export interface TrackerData {
  totalConversions: number;
  totalJsonChars: number;
  totalTsonChars: number;
  totalJsonTokens: number;
  totalTsonTokens: number;
  totalSavedTokens: number;
  overallSavingsPercentage: number;
  lastUpdated: string;
  history: Array<{
    timestamp: string;
    jsonTokens: number;
    tsonTokens: number;
    savedTokens: number;
    savingsPercentage: number;
    docCount?: number;
  }>;
}

const DEFAULT_TRACKER_FILE = 'SAVINGS_TRACKER.json';

export class TokenTracker {
  private filePath: string;
  private data: TrackerData;

  constructor(customFilePath?: string) {
    this.filePath = customFilePath || path.resolve(process.cwd(), DEFAULT_TRACKER_FILE);
    this.data = this.load();
  }

  private load(): TrackerData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // Default
    }

    return {
      totalConversions: 0,
      totalJsonChars: 0,
      totalTsonChars: 0,
      totalJsonTokens: 0,
      totalTsonTokens: 0,
      totalSavedTokens: 0,
      overallSavingsPercentage: 0,
      lastUpdated: new Date().toISOString(),
      history: [],
    };
  }

  public save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn(`[firestore-tson-sdk] Could not save token tracker file: ${(err as Error).message}`);
    }
  }

  public logConversion(jsonStr: string, tsonStr: string, docCount?: number): TokenSavingsAnalysis {
    const analysis = analyzeTokenSavings(jsonStr, tsonStr);

    this.data.totalConversions += 1;
    this.data.totalJsonChars += analysis.jsonCharCount;
    this.data.totalTsonChars += analysis.tsonCharCount;
    this.data.totalJsonTokens += analysis.jsonEstimatedTokens;
    this.data.totalTsonTokens += analysis.tsonEstimatedTokens;
    this.data.totalSavedTokens += analysis.savedTokens;

    this.data.overallSavingsPercentage = this.data.totalJsonChars > 0
      ? Number((((this.data.totalJsonChars - this.data.totalTsonChars) / this.data.totalJsonChars) * 100).toFixed(2))
      : 0;

    this.data.lastUpdated = new Date().toISOString();

    this.data.history.unshift({
      timestamp: this.data.lastUpdated,
      jsonTokens: analysis.jsonEstimatedTokens,
      tsonTokens: analysis.tsonEstimatedTokens,
      savedTokens: analysis.savedTokens,
      savingsPercentage: analysis.savingsPercentage,
      docCount,
    });

    if (this.data.history.length > 100) {
      this.data.history = this.data.history.slice(0, 100);
    }

    this.save();
    return analysis;
  }

  public getStats(): TrackerData {
    return { ...this.data };
  }

  public reset(): void {
    this.data = {
      totalConversions: 0,
      totalJsonChars: 0,
      totalTsonChars: 0,
      totalJsonTokens: 0,
      totalTsonTokens: 0,
      totalSavedTokens: 0,
      overallSavingsPercentage: 0,
      lastUpdated: new Date().toISOString(),
      history: [],
    };
    this.save();
  }
}

let globalTrackerInstance: TokenTracker | null = null;

export function getGlobalSavingsTracker(filePath?: string): TokenTracker {
  if (!globalTrackerInstance) {
    globalTrackerInstance = new TokenTracker(filePath);
  }
  return globalTrackerInstance;
}
