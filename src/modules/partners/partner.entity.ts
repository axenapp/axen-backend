import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum PartnerStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('partners')
export class Partner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 300, nullable: true })
  address: string;

  @Column({ type: 'float', nullable: true })
  lat: number;

  @Column({ type: 'float', nullable: true })
  lng: number;

  @Column({
    type: 'enum',
    enum: PartnerStatus,
    default: PartnerStatus.DRAFT,
  })
  status: PartnerStatus;

  @Column({ type: 'jsonb', nullable: true })
schedule: {
  monday?:    { open: string; close: string } | null;
  tuesday?:   { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?:  { open: string; close: string } | null;
  friday?:    { open: string; close: string } | null;
  saturday?:  { open: string; close: string } | null;
  sunday?:    { open: string; close: string } | null;
} | null;

  @Column({ name: 'cancel_window_hours', default: 2 })
  cancelWindowHours: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}