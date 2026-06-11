import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatCompletionMessageParam, ChatCompletionToolMessageParam } from 'openai/resources/chat/completions';
import {
  GenerationProgressHandler,
  GenerationResult,
  ValidatedCandidate,
} from '../common/types';
import { SectionTemplate } from '../validation/candidate.validator';
import { ValidationService } from '../validation/validation.service';
import { PromptBuilder } from './prompt.builder';
import { GenerationRun } from '../database/entities/generation-run.entity';
import { Candidate } from '../database/entities/candidate.entity';

@Injectable()
export class LyricGenerationService {
  private readonly logger = new Logger(LyricGenerationService.name);
  private openai: OpenAI | null = null;
  private readonly model: string;
  private readonly maxToolRounds: number;

  constructor(
    private readonly config: ConfigService,
    private readonly promptBuilder: PromptBuilder,
    private readonly validationService: ValidationService,
    @InjectRepository(GenerationRun)
    private readonly runRepo: Repository<GenerationRun>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
  ) {
    this.model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o';
    this.maxToolRounds = Number(
      this.config.get<string>('GENERATION_MAX_TOOL_ROUNDS') ?? 20,
    );
  }

  private getOpenAI(): OpenAI {
    if (this.openai) {
      return this.openai;
    }

    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({ apiKey });
    return this.openai;
  }

  async generate(
    options: {
      songId: string;
      sectionId: string;
      songTitle: string;
      sectionName: string;
      userRequest?: string;
      template: SectionTemplate;
    },
    onProgress?: GenerationProgressHandler,
  ): Promise<GenerationResult> {
    const userRequest =
      options.userRequest ??
      `Write ${options.template.lineConstraints.length} lines.`;

    const systemPrompt = this.promptBuilder.buildAgentSystemPrompt({
      songTitle: options.songTitle,
      sectionName: options.sectionName,
      template: options.template,
    });

    const run = await this.runRepo.save(
      this.runRepo.create({
        songId: options.songId,
        sectionId: options.sectionId,
        batchNumber: 1,
        prompt: `${systemPrompt}\n\n${this.promptBuilder.buildAgentUserPrompt(userRequest)}`,
      }),
    );

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: this.promptBuilder.buildAgentUserPrompt(userRequest),
      },
    ];

    const tools = this.validationService.getTools();
    let toolCalls = 0;
    let lastValid: ValidatedCandidate | null = null;
    let lastRejected: ValidatedCandidate | null = null;
    let totalGenerated = 0;

    onProgress?.({
      type: 'status',
      message: 'Starting lyric generation…',
      phase: 'starting',
    });

    for (let round = 0; round < this.maxToolRounds; round += 1) {
      onProgress?.({
        type: 'status',
        message: `Thinking (round ${round + 1} of ${this.maxToolRounds})…`,
        phase: 'thinking',
      });
      onProgress?.({
        type: 'progress',
        round: round + 1,
        maxRounds: this.maxToolRounds,
        toolCalls,
        attempts: totalGenerated,
      });

      const response = await this.getOpenAI().chat.completions.create({
        model: this.model,
        temperature: 0.4,
        messages,
        tools,
        tool_choice: 'auto',
      });

      const assistantMessage = response.choices[0]?.message;
      if (!assistantMessage) {
        break;
      }

      messages.push(assistantMessage);

      if (!assistantMessage.tool_calls?.length) {
        break;
      }

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== 'function') {
          continue;
        }

        toolCalls += 1;
        const args = JSON.parse(toolCall.function.arguments) as Record<
          string,
          unknown
        >;

        onProgress?.({
          type: 'tool',
          name: toolCall.function.name,
          summary: this.describeToolCall(toolCall.function.name, args),
          round: round + 1,
        });
        onProgress?.({
          type: 'progress',
          round: round + 1,
          maxRounds: this.maxToolRounds,
          toolCalls,
          attempts: totalGenerated,
        });

        const result = await this.validationService.executeTool(
          toolCall.function.name,
          args,
          options.template,
        );

        if (
          toolCall.function.name === 'validate_verse' &&
          Array.isArray(args.lines)
        ) {
          totalGenerated += 1;
          const lines = args.lines as string[];
          const validation = await this.validationService.validateVerse(
            lines,
            options.template,
          );

          const wrapped: ValidatedCandidate = {
            lines,
            validation: {
              valid: validation.valid,
              lines: validation.lineResults.map((line) => ({
                lineNumber: line.lineNumber,
                line: line.line,
                valid: line.valid,
                syllablesMatch:
                  line.actual.syllableCount === line.expected.syllableCount,
                stressMatch:
                  line.actual.stressPattern === line.expected.stressPattern,
                stressValidated:
                  options.template.validateStress ?? false,
                expected: line.expected,
                actual: line.actual,
                failures: line.failures,
              })),
              rhymes: validation.rhymeResults,
              failures: validation.failures,
            },
            passed: validation.valid,
          };

          await this.candidateRepo.save(
            this.candidateRepo.create({
              runId: run.id,
              linesJson: lines,
              validationJson: wrapped.validation,
              passed: wrapped.passed,
            }),
          );

          onProgress?.({
            type: 'candidate',
            candidate: wrapped,
            attempt: totalGenerated,
          });

          if (wrapped.passed) {
            lastValid = wrapped;
          } else {
            lastRejected = wrapped;
          }
        }

        const toolMessage: ChatCompletionToolMessageParam = {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        };
        messages.push(toolMessage);

        if (
          toolCall.function.name === 'validate_verse' &&
          (result as { valid?: boolean }).valid
        ) {
          this.logger.log(`Valid verse found after ${toolCalls} tool calls`);
        }
      }

      if (lastValid) {
        break;
      }
    }

    const passed = lastValid ? [lastValid] : [];
    const rejected = lastRejected ? [lastRejected] : [];

    this.logger.log(
      `Agent run ${run.id}: ${passed.length} passed, ${toolCalls} tool calls, ${totalGenerated} verse attempts`,
    );

    onProgress?.({
      type: 'status',
      message:
        passed.length > 0
          ? 'Valid verse found.'
          : 'Finished — no verse passed all constraints.',
      phase: 'done',
    });

    return {
      runId: run.id,
      batchCount: 1,
      totalGenerated: Math.max(totalGenerated, toolCalls),
      passed,
      rejected: passed.length ? [] : rejected.slice(0, 5),
    };
  }

  private describeToolCall(
    name: string,
    args: Record<string, unknown>,
  ): string {
    switch (name) {
      case 'lookup_word': {
        const word = String(args.word ?? '');
        return `Looking up pronunciation for “${word}”`;
      }
      case 'compare_rhyme': {
        const w1 = String(args.word1 ?? '');
        const w2 = String(args.word2 ?? '');
        return `Checking rhyme: “${w1}” / “${w2}”`;
      }
      case 'validate_line': {
        const lineNumber = Number(args.lineNumber ?? 0);
        const line = String(args.line ?? '').trim();
        const preview =
          line.length > 48 ? `${line.slice(0, 48).trim()}…` : line;
        return `Checking line ${lineNumber}: “${preview}”`;
      }
      case 'validate_verse': {
        const lines = Array.isArray(args.lines) ? args.lines : [];
        return `Validating full verse (${lines.length} lines)`;
      }
      default:
        return `Running ${name}`;
    }
  }
}
