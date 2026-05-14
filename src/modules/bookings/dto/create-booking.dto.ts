import { IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID('all')
  slotId: string;

  @IsUUID('all')
  serviceId: string;
}