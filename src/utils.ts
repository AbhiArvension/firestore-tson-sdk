import { TokenSavingsAnalysis } from './types.js';

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function analyzeTokenSavings(jsonStr: string, tsonStr: string): TokenSavingsAnalysis {
  const jsonCharCount = jsonStr.length;
  const tsonCharCount = tsonStr.length;

  const jsonEstimatedTokens = estimateTokens(jsonStr);
  const tsonEstimatedTokens = estimateTokens(tsonStr);

  const savedTokens = Math.max(0, jsonEstimatedTokens - tsonEstimatedTokens);
  const savingsPercentage = jsonCharCount > 0
    ? Number((((jsonCharCount - tsonCharCount) / jsonCharCount) * 100).toFixed(2))
    : 0;

  return {
    jsonCharCount,
    tsonCharCount,
    jsonEstimatedTokens,
    tsonEstimatedTokens,
    savedTokens,
    savingsPercentage,
  };
}

export function formatPrimitive(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return '';
  if (typeof val === 'boolean' || typeof val === 'number') return String(val);

  if (typeof val === 'string') {
    if (val.includes('\n')) {
      return `| ${val.replace(/\n/g, '\n  ')}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(val)) {
      return val;
    }
    if (val.includes(',') || val.includes(': ') || val.startsWith(' ') || val.endsWith(' ')) {
      return JSON.stringify(val);
    }
    return val;
  }

  return JSON.stringify(val);
}
