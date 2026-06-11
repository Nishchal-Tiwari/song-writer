import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompareResult } from '../../common/types';

interface PhonetikScanResponse {
  line1?: {
    text: string;
    syllableCount: number;
    stressPattern: number[];
    binaryPattern?: number[];
  };
  error?: string;
}

interface PhonetikSyllableResponse {
  word: string;
  phonemes: string[];
  syllableCount: number;
  stressPattern: number[];
  error?: string;
}

@Injectable()
export class PhonetikClient {
  private readonly logger = new Logger(PhonetikClient.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('PHONETIK_URL') ?? 'http://127.0.0.1:1273';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      this.logger.warn(`Phonetik health check failed: ${String(error)}`);
      return false;
    }
  }

  async scanLine(line: string): Promise<PhonetikScanResponse['line1']> {
    const url = new URL(`${this.baseUrl}/scan`);
    url.searchParams.set('line1', line);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Phonetik scan failed with status ${response.status}`);
    }

    const data = (await response.json()) as PhonetikScanResponse;
    if (!data.line1) {
      throw new Error(data.error ?? 'Phonetik scan returned no line data');
    }

    return data.line1;
  }

  async lookupWord(word: string): Promise<PhonetikSyllableResponse | null> {
    const url = new URL(`${this.baseUrl}/syllables`);
    url.searchParams.set('word', word);

    const response = await fetch(url.toString());
    const data = (await response.json()) as PhonetikSyllableResponse;

    if (!response.ok || data.error) {
      return null;
    }

    return data;
  }

  async compareWords(
    word1: string,
    word2: string,
  ): Promise<CompareResult | null> {
    const url = new URL(`${this.baseUrl}/compare`);
    url.searchParams.set('word1', word1);
    url.searchParams.set('word2', word2);

    const response = await fetch(url.toString());
    const data = (await response.json()) as {
      word1?: string;
      word2?: string;
      similarity?: number;
      rhymeType?: string;
      confidence?: number;
      error?: string;
    };

    if (!response.ok) {
      if (response.status === 404) {
        this.logger.debug(
          `Phonetik compare unavailable for "${word1}" / "${word2}": ${data.error ?? 'not found'}`,
        );
        return null;
      }

      throw new Error(
        `Phonetik compare failed with status ${response.status}: ${data.error ?? 'unknown error'}`,
      );
    }

    return {
      word1: data.word1 ?? word1,
      word2: data.word2 ?? word2,
      similarity: data.similarity ?? 0,
      rhymeType: data.rhymeType ?? 'none',
      confidence: data.confidence ?? 0,
    };
  }
}
