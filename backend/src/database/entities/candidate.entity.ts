import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GenerationRun } from './generation-run.entity';
import type { CandidateValidationResult } from '../../common/types';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'run_id' })
  runId: string;

  @ManyToOne(() => GenerationRun, (run) => run.candidates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'run_id' })
  run: GenerationRun;

  @Column({ name: 'lines_json', type: 'jsonb' })
  linesJson: string[];

  @Column({ name: 'validation_json', type: 'jsonb' })
  validationJson: CandidateValidationResult;

  @Column()
  passed: boolean;
}
