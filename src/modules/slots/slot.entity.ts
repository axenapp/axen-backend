import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Partner } from '../partners/partner.entity';
import { Service } from '../services/service.entity';

export enum SlotStatus {
  FREE = 'free',
  RESERVED = 'reserved',
  BLOCKED = 'blocked',
}

@Entity('slots')
export class Slot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Partner)
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @Column({ type: 'timestamp' })
  datetime: Date;

  @Column({
    type: 'enum',
    enum: SlotStatus,
    default: SlotStatus.FREE,
  })
  status: SlotStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}