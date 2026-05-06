import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  durationMinutes: number;

  @IsNumber()
  @Min(0.01)
  price: number;
}