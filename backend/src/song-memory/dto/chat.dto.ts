import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class GenerateLyricsDto {
  @IsOptional()
  @IsString()
  userRequest?: string;
}

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsBoolean()
  generate?: boolean;
}
