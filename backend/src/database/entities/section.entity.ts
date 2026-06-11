import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Song } from './song.entity';
import { LineConstraint } from './line-constraint.entity';
import { GenerationRun } from './generation-run.entity';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'song_id' })
  songId: string;

  @ManyToOne(() => Song, (song) => song.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'song_id' })
  song: Song;

  @Column()
  name: string;

  @Column({ name: 'rhyme_scheme' })
  rhymeScheme: string;

  @Column({ name: 'validate_stress', type: 'boolean', default: false })
  validateStress: boolean;

  @OneToMany(() => LineConstraint, (constraint) => constraint.section, {
    cascade: true,
  })
  lineConstraints: LineConstraint[];

  @OneToMany(() => GenerationRun, (run) => run.section)
  generationRuns: GenerationRun[];
}
