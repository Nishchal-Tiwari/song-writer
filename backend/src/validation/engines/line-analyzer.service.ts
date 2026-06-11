import { Injectable } from '@nestjs/common';
import { LineAnalysis, WordAnalysis } from '../../common/types';
import { normalizeStressPattern, tokenizeLine } from '../../common/utils';
import { CmuDictionaryService } from './cmu-dictionary.service';

@Injectable()
export class LineAnalyzerService {
  constructor(private readonly dictionary: CmuDictionaryService) {}

  async analyze(line: string): Promise<LineAnalysis> {
    const words = tokenizeLine(line);
    const unknownWords: string[] = [];
    const wordAnalyses: WordAnalysis[] = [];
    let syllableCount = 0;
    let stressPattern = '';

    for (const word of words) {
      const lookup = await this.dictionary.lookup(word);
      if (!lookup) {
        unknownWords.push(word);
        continue;
      }

      syllableCount += lookup.syllableCount;
      stressPattern += lookup.stressPattern;

      wordAnalyses.push({
        word: lookup.word,
        syllableCount: lookup.syllableCount,
        stressPattern: lookup.stressPattern,
        phonemes: lookup.phonemes,
      });
    }

    const stressPatternRaw = stressPattern.split('').map((digit) => Number(digit));

    return {
      line,
      syllableCount,
      stressPattern,
      stressPatternRaw,
      words: wordAnalyses,
      unknownWords,
    };
  }
}
