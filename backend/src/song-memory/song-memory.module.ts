import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from '../database/entities/song.entity';
import { Section } from '../database/entities/section.entity';
import { LineConstraint } from '../database/entities/line-constraint.entity';
import { Message } from '../database/entities/message.entity';
import { AiModule } from '../ai/ai.module';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

/**
 * Song Memory — songs, sections, rules, chat history
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Song, Section, LineConstraint, Message]),
    AiModule,
  ],
  controllers: [SongsController, ChatController],
  providers: [SongsService, ChatService],
  exports: [SongsService, ChatService],
})
export class SongMemoryModule {}
