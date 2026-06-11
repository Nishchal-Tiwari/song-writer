import { Body, Controller, Get, Post } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { ValidateLineDto } from './dto/validate-line.dto';

@Controller('validate')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Get('health')
  async health() {
    return this.validationService.health();
  }

  @Post('line')
  async validateLine(@Body() dto: ValidateLineDto) {
    const result = await this.validationService.validateLine(
      dto.line,
      1,
      {
        rhymeScheme: 'A',
        lineConstraints: [
          {
            lineNumber: 1,
            syllableCount: dto.syllableCount,
            stressPattern: dto.stressPattern,
          },
        ],
      },
    );

    return result;
  }
}
