import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Song } from '../database/entities/song.entity';
import { Section } from '../database/entities/section.entity';
import { LineConstraint } from '../database/entities/line-constraint.entity';
import {
  CreateSectionDto,
  CreateSongDto,
  UpdateSectionDto,
} from './dto/song.dto';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private readonly songRepo: Repository<Song>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(LineConstraint)
    private readonly constraintRepo: Repository<LineConstraint>,
  ) {}

  findAll() {
    return this.songRepo.find({
      relations: {
        sections: {
          lineConstraints: true,
        },
      },
      order: {
        createdAt: 'DESC',
        sections: {
          lineConstraints: {
            lineNumber: 'ASC',
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const song = await this.songRepo.findOne({
      where: { id },
      relations: {
        sections: {
          lineConstraints: true,
        },
        messages: true,
      },
      order: {
        sections: {
          lineConstraints: {
            lineNumber: 'ASC',
          },
        },
        messages: {
          createdAt: 'ASC',
        },
      },
    });

    if (!song) {
      throw new NotFoundException(`Song ${id} not found`);
    }

    return song;
  }

  async create(dto: CreateSongDto) {
    const song = this.songRepo.create({
      title: dto.title,
      theme: dto.theme ?? '',
    });

    return this.songRepo.save(song);
  }

  async addSection(songId: string, dto: CreateSectionDto) {
    await this.findOne(songId);

    const section = this.sectionRepo.create({
      songId,
      name: dto.name,
      rhymeScheme: dto.rhymeScheme,
      validateStress: dto.validateStress ?? false,
      lineConstraints: dto.lineConstraints.map((constraint) =>
        this.constraintRepo.create({
          lineNumber: constraint.lineNumber,
          syllableCount: constraint.syllableCount,
          stressPattern: constraint.stressPattern,
        }),
      ),
    });

    return this.sectionRepo.save(section);
  }

  async updateSection(sectionId: string, dto: UpdateSectionDto) {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
      relations: { lineConstraints: true },
    });

    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    if (dto.name) {
      section.name = dto.name;
    }
    if (dto.rhymeScheme) {
      section.rhymeScheme = dto.rhymeScheme;
    }
    if (dto.validateStress !== undefined) {
      section.validateStress = dto.validateStress;
    }

    if (dto.lineConstraints) {
      await this.constraintRepo.delete({ sectionId });
      section.lineConstraints = dto.lineConstraints.map((constraint) =>
        this.constraintRepo.create({
          lineNumber: constraint.lineNumber,
          syllableCount: constraint.syllableCount,
          stressPattern: constraint.stressPattern,
          sectionId,
        }),
      );
    }

    return this.sectionRepo.save(section);
  }
}
