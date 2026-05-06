import { IsUUID, IsArray, IsDateString, ArrayMinSize } from 'class-validator';

export class CreateSlotsDto {
  @IsUUID()
  serviceId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsDateString({}, { each: true })
  datetimes: string[];
}