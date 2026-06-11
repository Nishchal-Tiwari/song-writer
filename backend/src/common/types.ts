export interface LineAnalysis {
  line: string;
  syllableCount: number;
  stressPattern: string;
  stressPatternRaw: number[];
  words: WordAnalysis[];
  unknownWords: string[];
}

export interface WordAnalysis {
  word: string;
  syllableCount: number;
  stressPattern: string;
  phonemes: string[];
}

export interface CompareResult {
  word1: string;
  word2: string;
  similarity: number;
  rhymeType: string;
  confidence: number;
}

export interface LineConstraint {
  lineNumber: number;
  syllableCount: number;
  stressPattern: string;
  contentHint?: string;
}

export interface LineValidationResult {
  lineNumber: number;
  line: string;
  valid: boolean;
  syllablesMatch: boolean;
  stressMatch: boolean;
  stressValidated: boolean;
  expected: {
    syllableCount: number;
    stressPattern: string;
  };
  actual: {
    syllableCount: number;
    stressPattern: string;
  };
  failures: string[];
}

export interface RhymePairValidation {
  lineA: number;
  lineB: number;
  wordA: string;
  wordB: string;
  valid: boolean;
  rhymeType?: string;
  confidence?: number;
  failure?: string;
}

export interface CandidateValidationResult {
  valid: boolean;
  lines: LineValidationResult[];
  rhymes: RhymePairValidation[];
  failures: string[];
}

export interface GenerationCandidate {
  lines: string[];
}

export interface ValidatedCandidate {
  lines: string[];
  validation: CandidateValidationResult;
  passed: boolean;
}

export interface GenerationResult {
  runId: string;
  batchCount: number;
  totalGenerated: number;
  passed: ValidatedCandidate[];
  rejected: ValidatedCandidate[];
}

export type GenerationProgressEvent =
  | {
      type: 'status';
      message: string;
      phase: 'starting' | 'thinking' | 'tool' | 'validating' | 'done';
    }
  | {
      type: 'tool';
      name: string;
      summary: string;
      round: number;
    }
  | {
      type: 'candidate';
      candidate: ValidatedCandidate;
      attempt: number;
    }
  | {
      type: 'progress';
      round: number;
      maxRounds: number;
      toolCalls: number;
      attempts: number;
    };

export type GenerationProgressHandler = (
  event: GenerationProgressEvent,
) => void;
