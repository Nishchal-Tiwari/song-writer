import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ValidateLineDto {
  @IsString()
  @MinLength(1)
  line: string;

  @IsInt()
  @Min(1)
  syllableCount: number;

  @IsString()
  @MinLength(1)
  stressPattern: string;
}
