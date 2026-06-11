import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Song } from './entities/song.entity';
import { Section } from './entities/section.entity';
import { LineConstraint } from './entities/line-constraint.entity';
import { Message } from './entities/message.entity';
import { GenerationRun } from './entities/generation-run.entity';
import { Candidate } from './entities/candidate.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          Song,
          Section,
          LineConstraint,
          Message,
          GenerationRun,
          Candidate,
        ],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
