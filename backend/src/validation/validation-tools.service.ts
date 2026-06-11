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

    return this.formatVerseResult(lines, validation);
  }

  formatVerseResult(lines: string[], validation: CandidateValidationResult) {
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
    };
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
          name: 'validate_line',
          description:
            'Validate one lyric line against its syllable count and stress pattern constraint.',
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
            'Validate a full verse against all line constraints and the rhyme scheme. Call this before presenting lyrics to the user. If invalid, revise and call again.',
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
