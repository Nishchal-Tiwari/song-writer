import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Section } from './section.entity';

@Entity('line_constraints')
export class LineConstraint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'section_id' })
  sectionId: string;

  @ManyToOne(() => Section, (section) => section.lineConstraints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @Column({ name: 'line_number', type: 'int' })
  lineNumber: number;

  @Column({ name: 'syllable_count', type: 'int' })
  syllableCount: number;

  @Column({ name: 'stress_pattern' })
  stressPattern: string;

  @Column({ name: 'content_hint', type: 'text', nullable: true })
  contentHint?: string | null;
}
