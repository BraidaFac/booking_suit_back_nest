import { Module } from '@nestjs/common';
import { BookingController } from './controller/booking.controller';
import { BookingService } from './service/booking.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entity/booking.entity';
import { Suit } from 'src/suit/entity/suit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Suit])],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
