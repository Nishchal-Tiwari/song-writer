import { Injectable } from '@nestjs/common';
import {
  CandidateValidationResult,
  LineConstraint,
} from '../common/types';
import { LineValidator } from './line.validator';
import { RhymeCheckerService } from './rhyme-checker.service';

export interface SectionTemplate {
  rhymeScheme: string;
  lineConstraints: LineConstraint[];
  validateStress?: boolean;
}

@Injectable()
export class CandidateValidator {
  constructor(
    private readonly lineValidator: LineValidator,
    private readonly rhymeChecker: RhymeCheckerService,
  ) {}

  async validateCandidate(
    lines: string[],
    template: SectionTemplate,
  ): Promise<CandidateValidationResult> {
    const validateStress = template.validateStress ?? false;
    const failures: string[] = [];
    const lineResults = await Promise.all(
      template.lineConstraints.map((constraint, index) =>
        this.lineValidator.validate(
          lines[index] ?? '',
          {
            ...constraint,
            lineNumber: index + 1,
          },
          validateStress,
        ),
      ),
    );

    for (const result of lineResults) {
      if (!result.valid) {
        failures.push(
          `Line ${result.lineNumber}: ${result.failures.join('; ')}`,
        );
      }
    }

    const rhymeResults = await this.rhymeChecker.validate(
      lines,
      template.rhymeScheme,
    );

    for (const rhyme of rhymeResults) {
      if (!rhyme.valid && rhyme.failure) {
        failures.push(`Rhyme L${rhyme.lineA}/L${rhyme.lineB}: ${rhyme.failure}`);
      }
    }

    return {
      valid:
        lineResults.every((result) => result.valid) &&
        rhymeResults.every((result) => result.valid),
      lines: lineResults,
      rhymes: rhymeResults,
      failures,
    };
  }
}
