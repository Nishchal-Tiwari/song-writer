import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SongsService } from './songs.service';
import {
  CreateSectionDto,
  CreateSongDto,
  UpdateSectionDto,
} from './dto/song.dto';

@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get()
  findAll() {
    return this.songsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.songsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSongDto) {
    return this.songsService.create(dto);
  }

  @Post(':id/sections')
  addSection(@Param('id') id: string, @Body() dto: CreateSectionDto) {
    return this.songsService.addSection(id, dto);
  }

  @Patch('sections/:sectionId')
  updateSection(
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.songsService.updateSection(sectionId, dto);
  }
}
