import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Song } from './song.entity';
import { Section } from './section.entity';
import { Candidate } from './candidate.entity';

@Entity('generation_runs')
export class GenerationRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'song_id' })
  songId: string;

  @ManyToOne(() => Song, (song) => song.generationRuns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'song_id' })
  song: Song;

  @Column({ name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => Section, (section) => section.generationRuns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @Column({ name: 'batch_number', type: 'int' })
  batchNumber: number;

  @Column({ type: 'text' })
  prompt: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Candidate, (candidate) => candidate.run, { cascade: true })
  candidates: Candidate[];
}
