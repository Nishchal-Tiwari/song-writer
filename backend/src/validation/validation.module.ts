import { Module } from '@nestjs/common';
import { PhonetikClient } from './engines/phonetik.client';
import { CmuDictionaryService } from './engines/cmu-dictionary.service';
import { LineAnalyzerService } from './engines/line-analyzer.service';
import { LineValidator } from './line.validator';
import { RhymeCheckerService } from './rhyme-checker.service';
import { CandidateValidator } from './candidate.validator';
import { ValidationToolsService } from './validation-tools.service';
import { ValidationService } from './validation.service';
import { ValidationController } from './validation.controller';

@Module({
  controllers: [ValidationController],
  providers: [
    PhonetikClient,
    CmuDictionaryService,
    LineAnalyzerService,
    LineValidator,
    RhymeCheckerService,
    CandidateValidator,
    ValidationToolsService,
    ValidationService,
  ],
  exports: [ValidationService, ValidationToolsService, CandidateValidator],
})
export class ValidationModule {}
