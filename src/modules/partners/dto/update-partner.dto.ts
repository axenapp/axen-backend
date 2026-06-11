import { IsOptional, IsString, IsNumber, IsObject } from 'class-validator';

interface DaySchedule {
  open: string;
  close: string;
}

export class UpdatePartnerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  cancelWindowHours?: number;

  @IsOptional()
  @IsObject()
  schedule?: {
    monday?:    DaySchedule | null;
    tuesday?:   DaySchedule | null;
    wednesday?: DaySchedule | null;
    thursday?:  DaySchedule | null;
    friday?:    DaySchedule | null;
    saturday?:  DaySchedule | null;
    sunday?:    DaySchedule | null;
  };
}