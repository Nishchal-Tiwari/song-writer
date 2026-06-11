import { Injectable } from '@nestjs/common';
import { LineConstraint, LineValidationResult } from '../common/types';
import { normalizeStressPattern } from '../common/utils';
import { LineAnalyzerService } from './engines/line-analyzer.service';

@Injectable()
export class LineValidator {
  constructor(private readonly analyzer: LineAnalyzerService) {}

  async validate(
    line: string,
    constraint: LineConstraint,
    validateStress = false,
  ): Promise<LineValidationResult> {
    const analysis = await this.analyzer.analyze(line);
    const expectedStress = normalizeStressPattern(constraint.stressPattern);
    const failures: string[] = [];

    if (analysis.unknownWords.length > 0) {
      failures.push(
        `Unknown pronunciation: ${analysis.unknownWords.map((word) => `"${word}"`).join(', ')}`,
      );
    }

    const syllablesMatch =
      analysis.syllableCount === constraint.syllableCount;
    if (!syllablesMatch) {
      failures.push(
        `Expected ${constraint.syllableCount} syllables, got ${analysis.syllableCount}`,
      );
    }

    const stressMatch = analysis.stressPattern === expectedStress;
    // Stress is the most restrictive constraint, so it is only enforced when
    // explicitly enabled. When disabled it is still measured and reported as
    // informational, but it never causes a line to fail.
    if (validateStress && !stressMatch) {
      failures.push(
        `Expected stress ${expectedStress}, got ${analysis.stressPattern}`,
      );
    }

    return {
      lineNumber: constraint.lineNumber,
      line,
      valid: failures.length === 0,
      syllablesMatch,
      stressMatch,
      stressValidated: validateStress,
      expected: {
        syllableCount: constraint.syllableCount,
        stressPattern: expectedStress,
      },
      actual: {
        syllableCount: analysis.syllableCount,
        stressPattern: analysis.stressPattern,
      },
      failures,
    };
  }
}
