import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerationProgressEvent, GenerationResult } from '../common/types';
import { Message } from '../database/entities/message.entity';
import { SongsService } from './songs.service';
import { AiService } from '../ai/ai.service';
import { CreateMessageDto } from './dto/chat.dto';
import { Section } from '../database/entities/section.entity';

type StreamEmitter = (event: string, data: unknown) => void;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly songsService: SongsService,
    private readonly aiService: AiService,
  ) {}

  async addMessage(songId: string, dto: CreateMessageDto) {
    await this.songsService.findOne(songId);

    return this.messageRepo.save(
      this.messageRepo.create({
        songId,
        role: 'user',
        content: dto.content,
      }),
    );
  }

  async generate(
    songId: string,
    sectionId: string,
    userRequest?: string,
  ) {
    const { userMessage, assistantMessage, result } =
      await this.runGeneration(songId, sectionId, userRequest);

    return {
      userMessage,
      assistantMessage,
      result,
    };
  }

  async generateStream(
    songId: string,
    sectionId: string,
    userRequest: string | undefined,
    emit: StreamEmitter,
  ) {
    try {
      const { assistantMessage, result, userMessage } =
        await this.runGeneration(
          songId,
          sectionId,
          userRequest,
          (event) => {
            emit('progress', event);
          },
          (message) => {
            emit('user_message', message);
          },
        );

      emit('complete', {
        userMessage,
        assistantMessage,
        result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Generation failed';
      emit('error', { message });
      throw error;
    }
  }

  async getMessages(songId: string) {
    await this.songsService.findOne(songId);
    return this.messageRepo.find({
      where: { songId },
      order: { createdAt: 'ASC' },
    });
  }

  private async runGeneration(
    songId: string,
    sectionId: string,
    userRequest?: string,
    onProgress?: (event: GenerationProgressEvent) => void,
    onUserMessage?: (message: Message) => void,
  ) {
    const song = await this.songsService.findOne(songId);
    const section = song.sections.find((item) => item.id === sectionId);

    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    const requestText =
      userRequest?.trim() ||
      `Write ${section.lineConstraints.length} lines for ${section.name.toLowerCase()}.`;

    onProgress?.({
      type: 'status',
      message: 'Saving your request…',
      phase: 'starting',
    });

    const savedUserMessage = await this.messageRepo.save(
      this.messageRepo.create({
        songId,
        role: 'user',
        content: requestText,
      }),
    );

    onUserMessage?.(savedUserMessage);

    onProgress?.({
      type: 'status',
      message: 'Generating lyrics with phonetic validation…',
      phase: 'starting',
    });

    const result = await this.aiService.generateLyrics(
      {
        songId,
        sectionId,
        songTitle: song.title,
        sectionName: section.name,
        userRequest: requestText,
        template: this.buildTemplate(section),
      },
      onProgress,
    );

    const assistantContent = this.buildAssistantContent(result);

    const assistantMessage = await this.messageRepo.save(
      this.messageRepo.create({
        songId,
        role: 'assistant',
        content: assistantContent,
        metadataJson: {
          type: 'generation_result',
          sectionId,
          result,
        },
      }),
    );

    return {
      userMessage: savedUserMessage,
      assistantMessage,
      result,
    };
  }

  private buildTemplate(section: Section) {
    return {
      rhymeScheme: section.rhymeScheme,
      lineConstraints: section.lineConstraints.map((constraint) => ({
        lineNumber: constraint.lineNumber,
        syllableCount: constraint.syllableCount,
        stressPattern: constraint.stressPattern,
      })),
    };
  }

  private buildAssistantContent(result: GenerationResult) {
    return result.passed.length > 0
      ? `Here ${result.passed.length === 1 ? 'is' : 'are'} ${result.passed.length} valid suggestion${result.passed.length === 1 ? '' : 's'} that passed phonetic validation.`
      : `I couldn't produce lines that pass all constraints yet. The model used validation tools but nothing fully matched — try simpler rhyme words like room/moon or night/light.`;
  }
}
