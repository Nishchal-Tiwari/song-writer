import { Injectable } from '@nestjs/common';
import { RhymePairValidation } from '../common/types';
import { extractLastWord, getRhymePairs } from '../common/utils';
import { CmuDictionaryService } from './engines/cmu-dictionary.service';

@Injectable()
export class RhymeCheckerService {
  constructor(private readonly dictionary: CmuDictionaryService) {}

  async validate(
    lines: string[],
    rhymeScheme: string,
  ): Promise<RhymePairValidation[]> {
    const pairs = getRhymePairs(rhymeScheme);
    const results: RhymePairValidation[] = [];

    for (const [lineA, lineB] of pairs) {
      const wordA = extractLastWord(lines[lineA] ?? '');
      const wordB = extractLastWord(lines[lineB] ?? '');

      if (!wordA || !wordB) {
        results.push({
          lineA: lineA + 1,
          lineB: lineB + 1,
          wordA,
          wordB,
          valid: false,
          failure: 'Missing end word for rhyme comparison',
        });
        continue;
      }

      const comparison = await this.dictionary.compareRhyme(wordA, wordB);

      results.push({
        lineA: lineA + 1,
        lineB: lineB + 1,
        wordA,
        wordB,
        valid: comparison.valid,
        rhymeType: comparison.rhymeType,
        confidence: comparison.confidence,
        failure: comparison.valid
          ? undefined
          : comparison.failure ??
            `Rhyme mismatch between "${wordA}" and "${wordB}"`,
      });
    }

    return results;
  }
}
