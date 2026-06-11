import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Section } from './section.entity';
import { Message } from './message.entity';
import { GenerationRun } from './generation-run.entity';

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  theme: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Section, (section) => section.song, { cascade: true })
  sections: Section[];

  @OneToMany(() => Message, (message) => message.song, { cascade: true })
  messages: Message[];

  @OneToMany(() => GenerationRun, (run) => run.song)
  generationRuns: GenerationRun[];
}
