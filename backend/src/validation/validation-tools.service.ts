import { Injectable } from '@nestjs/common';
import { CandidateValidationResult } from '../common/types';
import { CmuDictionaryService } from './engines/cmu-dictionary.service';
import { LineValidator } from './line.validator';
import {
  CandidateValidator,
  SectionTemplate,
} from './candidate.validator';

@Injectable()
export class ValidationToolsService {
  constructor(
    private readonly lineValidator: LineValidator,
    private readonly candidateValidator: CandidateValidator,
    private readonly dictionary: CmuDictionaryService,
  ) {}

  async lookupWord(word: string) {
    const lookup = await this.dictionary.lookup(word);

    if (!lookup) {
      return {
        word,
        found: false,
        message: 'Word not in CMU/phonetik dictionary. Choose a different word.',
      };
    }

    return {
      word,
      found: true,
      matchedVariant: lookup.matchedVariant,
      syllableCount: lookup.syllableCount,
      stressPattern: lookup.stressPattern,
      phonemes: lookup.phonemes,
      source: lookup.source,
    };
  }

  async validateLine(
    line: string,
    lineNumber: number,
    template: SectionTemplate,
  ) {
    const constraint = template.lineConstraints.find(
      (item) => item.lineNumber === lineNumber,
    );

    if (!constraint) {
      return {
        valid: false,
        error: `No constraint defined for line ${lineNumber}`,
      };
    }

    const result = await this.lineValidator.validate(
      line,
      constraint,
      template.validateStress ?? false,
    );
    return {
      valid: result.valid,
      lineNumber,
      line,
      stressValidated: result.stressValidated,
      expected: result.expected,
      actual: result.actual,
      failures: result.failures,
    };
  }

  async validateVerse(lines: string[], template: SectionTemplate) {
    const validation = await this.candidateValidator.validateCandidate(
      lines,
      template,
    );

    return this.formatVerseResult(lines, validation, template);
  }

  async compareRhyme(word1: string, word2: string) {
    const comparison = await this.dictionary.compareRhyme(word1, word2);
    return {
      word1: comparison.word1,
      word2: comparison.word2,
      valid: comparison.valid,
      rhymeType: comparison.rhymeType,
      confidence: comparison.confidence,
      failure: comparison.failure,
      guidance: comparison.valid
        ? `"${comparison.word1}" and "${comparison.word2}" are a valid perfect rhyme pair.`
        : `"${comparison.word1}" and "${comparison.word2}" do NOT rhyme perfectly (${comparison.rhymeType}). Pick a different pair — try room/gloom, night/light, alone/known, sleep/deep.`,
    };
  }

  formatVerseResult(
    lines: string[],
    validation: CandidateValidationResult,
    template?: SectionTemplate,
  ) {
    const guidance = this.buildGuidance(validation, template);

    return {
      valid: validation.valid,
      lines,
      lineResults: validation.lines.map((line) => ({
        lineNumber: line.lineNumber,
        line: line.line,
        valid: line.valid,
        expected: line.expected,
        actual: line.actual,
        failures: line.failures,
      })),
      rhymeResults: validation.rhymes,
      failures: validation.failures,
      guidance,
    };
  }

  private buildGuidance(
    validation: CandidateValidationResult,
    template?: SectionTemplate,
  ): string[] {
    const guidance: string[] = [];

    for (const rhyme of validation.rhymes) {
      if (rhyme.valid) {
        continue;
      }

      guidance.push(
        `RHYME FIX — Lines ${rhyme.lineA} and ${rhyme.lineB} must end with perfect rhymes. ` +
          `Got "${rhyme.wordA}" / "${rhyme.wordB}" (${rhyme.rhymeType ?? 'no match'}). ` +
          `Change BOTH line endings to a verified pair (use compare_rhyme first). ` +
          `Good pairs: room/gloom, night/light, alone/known, deep/sleep.`,
      );
    }

    for (const line of validation.lines) {
      if (line.valid) {
        continue;
      }

      const syllableHint = line.failures.some((f) => f.includes('syllables'))
        ? ` Target exactly ${line.expected.syllableCount} syllables (currently ${line.actual.syllableCount}).`
        : '';

      guidance.push(
        `LINE ${line.lineNumber} FIX — ${line.failures.join('; ')}.${syllableHint} ` +
          `Rewrite only line ${line.lineNumber}; keep its end rhyme word if other paired lines already pass.`,
      );
    }

    if (!validation.valid && guidance.length === 0) {
      guidance.push(
        'Verse failed validation. Re-check syllable counts and rhyme end words for every line.',
      );
    }

    if (template?.rhymeScheme) {
      guidance.push(
        `Rhyme scheme ${template.rhymeScheme.toUpperCase()}: paired lines must share the same end rhyme sound. ` +
          `Plan end words BEFORE writing each line, then verify with compare_rhyme.`,
      );
    }

    return guidance;
  }

  getOpenAiTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'lookup_word',
          description:
            'Look up a word in the CMU pronouncing dictionary. Use this to verify rhyme words and count syllables before writing a line.',
          parameters: {
            type: 'object',
            properties: {
              word: { type: 'string', description: 'Single English word' },
            },
            required: ['word'],
            additionalProperties: false,
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'compare_rhyme',
          description:
            'Check if two words rhyme perfectly. Use this BEFORE writing lines to pick end rhyme words for each rhyme group.',
          parameters: {
            type: 'object',
            properties: {
              word1: { type: 'string', description: 'First end rhyme word' },
              word2: { type: 'string', description: 'Second end rhyme word' },
            },
            required: ['word1', 'word2'],
            additionalProperties: false,
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'validate_line',
          description:
            'Validate one lyric line against its syllable count (and stress if enabled). Does NOT check rhyme — use validate_verse for that.',
          parameters: {
            type: 'object',
            properties: {
              line: { type: 'string' },
              lineNumber: { type: 'integer', minimum: 1 },
            },
            required: ['line', 'lineNumber'],
            additionalProperties: false,
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'validate_verse',
          description:
            'Validate a full verse against all line constraints and the rhyme scheme. Returns a "guidance" array with exact fixes when invalid — read it and revise only the failing lines.',
          parameters: {
            type: 'object',
            properties: {
              lines: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of lyric lines in order',
              },
            },
            required: ['lines'],
            additionalProperties: false,
          },
        },
      },
    ];
  }
}
