import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationModule } from '../validation/validation.module';
import { PromptBuilder } from './prompt.builder';
import { LyricGenerationService } from './lyric-generation.service';
import { AiService } from './ai.service';
import { GenerationRun } from '../database/entities/generation-run.entity';
import { Candidate } from '../database/entities/candidate.entity';

@Module({
  imports: [
    ValidationModule,
    TypeOrmModule.forFeature([GenerationRun, Candidate]),
  ],
  providers: [PromptBuilder, LyricGenerationService, AiService],
  exports: [AiService, LyricGenerationService],
})
export class AiModule {}
