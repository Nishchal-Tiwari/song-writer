import { Injectable } from '@nestjs/common';
import { SectionTemplate } from './candidate.validator';
import { ValidationToolsService } from './validation-tools.service';
import { CandidateValidator } from './candidate.validator';
import { LineValidator } from './line.validator';
import { RhymeCheckerService } from './rhyme-checker.service';
import { CmuDictionaryService } from './engines/cmu-dictionary.service';
import { PhonetikClient } from './engines/phonetik.client';

/**
 * Validation Service — CMU Dictionary + phonetik + Rhyme Checker
 */
@Injectable()
export class ValidationService {
  constructor(
    private readonly tools: ValidationToolsService,
    private readonly candidateValidator: CandidateValidator,
    private readonly lineValidator: LineValidator,
    private readonly rhymeChecker: RhymeCheckerService,
    private readonly cmuDictionary: CmuDictionaryService,
    private readonly phonetik: PhonetikClient,
  ) {}

  health() {
    return this.phonetik.healthCheck().then((phonetikOk) => ({
      status: phonetikOk ? 'ok' : 'degraded',
      phonetik: phonetikOk,
      cmu: true,
    }));
  }

  lookupWord(word: string) {
    return this.tools.lookupWord(word);
  }

  validateLine(
    line: string,
    lineNumber: number,
    template: SectionTemplate,
  ) {
    return this.tools.validateLine(line, lineNumber, template);
  }

  validateVerse(lines: string[], template: SectionTemplate) {
    return this.tools.validateVerse(lines, template);
  }

  validateCandidate(lines: string[], template: SectionTemplate) {
    return this.candidateValidator.validateCandidate(lines, template);
  }

  checkRhyme(lines: string[], rhymeScheme: string) {
    return this.rhymeChecker.validate(lines, rhymeScheme);
  }

  getTools() {
    return this.tools.getOpenAiTools();
  }

  executeTool(
    name: string,
    args: Record<string, unknown>,
    template: SectionTemplate,
  ) {
    switch (name) {
      case 'lookup_word':
        return this.tools.lookupWord(String(args.word ?? ''));
      case 'validate_line':
        return this.tools.validateLine(
          String(args.line ?? ''),
          Number(args.lineNumber),
          template,
        );
      case 'validate_verse':
        return this.tools.validateVerse((args.lines as string[]) ?? [], template);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }
}
