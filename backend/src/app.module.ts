import { join } from 'path';
import { existsSync } from 'fs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DatabaseModule } from './database/database.module';
import { SongMemoryModule } from './song-memory/song-memory.module';
import { ValidationModule } from './validation/validation.module';
import { AiModule } from './ai/ai.module';

// Production build of the React app (web/dist). When present, NestJS serves it
// from the same origin so the API (/api) and the UI share one domain/port.
const webDist = join(__dirname, '..', '..', 'web', 'dist');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(existsSync(webDist)
      ? [
          ServeStaticModule.forRoot({
            rootPath: webDist,
            exclude: ['/api/{*path}'],
          }),
        ]
      : []),
    DatabaseModule,
    ValidationModule,
    AiModule,
    SongMemoryModule,
  ],
})
export class AppModule {}
