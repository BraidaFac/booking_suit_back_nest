import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Suit } from 'src/suit/entity/suit.entity';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsDateString()
  booking_date: Date;
  booking_state: 'ACTIVED' | 'CANCELED' | 'COMPLETED' | 'INPROGRESS';
  @IsNotEmpty()
  @IsObject()
  suit: Suit;
  @IsNotEmpty()
  @IsString()
  client_dni: string;
  @IsNotEmpty()
  @IsString()
  client_name: string;
  @IsNotEmpty()
  @IsString()
  client_phone: string;
  @IsNotEmpty()
  @IsString()
  account_related: string;
  @IsString()
  observations: string;
  @IsBoolean()
  dressmaker: boolean;
}
