import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LineRuleDto {
  @IsInt()
  @Min(1)
  lineNumber: number;

  @IsInt()
  @Min(1)
  syllableCount: number;

  @IsString()
  stressPattern: string;
}

export class CreateSectionDto {
  @IsString()
  name: string;

  @IsString()
  rhymeScheme: string;

  @IsOptional()
  @IsBoolean()
  validateStress?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineRuleDto)
  lineConstraints: LineRuleDto[];
}

export class CreateSongDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  theme?: string;
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  rhymeScheme?: string;

  @IsOptional()
  @IsBoolean()
  validateStress?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineRuleDto)
  lineConstraints?: LineRuleDto[];
}
