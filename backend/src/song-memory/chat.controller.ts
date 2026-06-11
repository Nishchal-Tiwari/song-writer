import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import * as express from 'express';
import { ChatService } from './chat.service';
import { CreateMessageDto, GenerateLyricsDto } from './dto/chat.dto';

@Controller('songs/:songId')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  getMessages(@Param('songId') songId: string) {
    return this.chatService.getMessages(songId);
  }

  @Post('messages')
  async addMessage(
    @Param('songId') songId: string,
    @Body() dto: CreateMessageDto,
  ) {
    const message = await this.chatService.addMessage(songId, dto);

    if (dto.generate && dto.sectionId) {
      return this.chatService.generate(songId, dto.sectionId, dto.content);
    }

    return { message };
  }

  @Post('messages/stream')
  async streamMessage(
    @Param('songId') songId: string,
    @Body() dto: CreateMessageDto,
    @Res() res: express.Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      if (!dto.sectionId) {
        send('error', { message: 'sectionId is required for generation' });
        res.end();
        return;
      }

      await this.chatService.generateStream(
        songId,
        dto.sectionId,
        dto.content,
        send,
      );
    } catch {
      // Error event already emitted by generateStream.
    } finally {
      res.end();
    }
  }

  @Post('generate/:sectionId')
  generate(
    @Param('songId') songId: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: GenerateLyricsDto,
  ) {
    return this.chatService.generate(songId, sectionId, dto.userRequest);
  }
}
