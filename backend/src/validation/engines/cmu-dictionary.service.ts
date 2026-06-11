import { Injectable } from '@nestjs/common';
import * as pronouncing from 'pronouncing';
import { WordAnalysis } from '../../common/types';
import { normalizeStressPattern, wordLookupVariants } from '../../common/utils';
import { PhonetikClient } from './phonetik.client';

export interface DictionaryLookup {
  word: string;
  matchedVariant: string;
  syllableCount: number;
  stressPattern: string;
  phonemes: string[];
  source: 'phonetik' | 'cmu';
}

@Injectable()
export class CmuDictionaryService {
  constructor(private readonly phonetik: PhonetikClient) {}

  async lookup(word: string): Promise<DictionaryLookup | null> {
    for (const variant of wordLookupVariants(word)) {
      const phonetikResult = await this.phonetik.lookupWord(variant);
      if (phonetikResult) {
        return {
          word,
          matchedVariant: variant,
          syllableCount: phonetikResult.syllableCount,
          stressPattern: normalizeStressPattern(phonetikResult.stressPattern),
          phonemes: phonetikResult.phonemes,
          source: 'phonetik',
        };
      }

      const cmuResult = this.lookupCmu(variant);
      if (cmuResult) {
        return {
          word,
          matchedVariant: variant,
          ...cmuResult,
          source: 'cmu',
        };
      }
    }

    return null;
  }

  async compareRhyme(word1: string, word2: string): Promise<{
    valid: boolean;
    rhymeType: string;
    confidence: number;
    word1: string;
    word2: string;
    failure?: string;
  }> {
    const phonetikCompare = await this.phonetik.compareWords(word1, word2);
    if (phonetikCompare) {
      const valid =
        phonetikCompare.rhymeType === 'perfect' &&
        phonetikCompare.confidence >= 0.8;
      return {
        valid,
        rhymeType: phonetikCompare.rhymeType,
        confidence: phonetikCompare.confidence,
        word1: phonetikCompare.word1,
        word2: phonetikCompare.word2,
        failure: valid
          ? undefined
          : `Rhyme mismatch (${phonetikCompare.rhymeType})`,
      };
    }

    const lookup1 = await this.lookup(word1);
    const lookup2 = await this.lookup(word2);

    if (!lookup1 || !lookup2) {
      return {
        valid: false,
        rhymeType: 'unknown',
        confidence: 0,
        word1,
        word2,
        failure: `Unknown pronunciation for "${!lookup1 ? word1 : word2}"`,
      };
    }

    const tail1 = this.rhymeTail(lookup1.phonemes);
    const tail2 = this.rhymeTail(lookup2.phonemes);
    const valid = tail1.length > 0 && tail1 === tail2;

    return {
      valid,
      rhymeType: valid ? 'perfect' : 'none',
      confidence: valid ? 1 : 0,
      word1: lookup1.matchedVariant,
      word2: lookup2.matchedVariant,
      failure: valid ? undefined : 'Rhyme tail mismatch (CMU)',
    };
  }

  private lookupCmu(variant: string): Omit<
    DictionaryLookup,
    'word' | 'matchedVariant' | 'source'
  > | null {
    const phones = pronouncing.phonesForWord(variant);
    if (!phones.length) {
      return null;
    }

    const phonemes = phones[0].split(' ');
    const stressDigits = pronouncing.stresses(phones[0])
      .split('')
      .map((digit) => Number(digit));

    return {
      syllableCount: pronouncing.syllableCount(phones[0]),
      stressPattern: normalizeStressPattern(stressDigits),
      phonemes,
    };
  }

  private rhymeTail(phonemes: string[]): string {
    let lastStressIndex = -1;

    phonemes.forEach((phoneme, index) => {
      if (/[12]/.test(phoneme)) {
        lastStressIndex = index;
      }
    });

    if (lastStressIndex === -1) {
      return phonemes.join(' ');
    }

    return phonemes.slice(lastStressIndex).join(' ');
  }
}
