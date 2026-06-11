import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerationProgressHandler } from '../common/types';
import { LyricGenerationService } from './lyric-generation.service';

/**
 * AI Service — OpenAI / Claude lyric generation with validation tools
 */
@Injectable()
export class AiService {
  constructor(
    private readonly lyricGeneration: LyricGenerationService,
    private readonly config: ConfigService,
  ) {}

  get provider(): string {
    return this.config.get<string>('AI_PROVIDER') ?? 'openai';
  }

  generateLyrics(
    options: Parameters<LyricGenerationService['generate']>[0],
    onProgress?: GenerationProgressHandler,
  ) {
    return this.lyricGeneration.generate(options, onProgress);
  }
}
