import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingService } from '../service/booking.service';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { SuitState } from 'src/utils/suit_utils';

@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}
  @Get()
  getBookings() {
    return this.bookingService.getBooking();
  }
  @Get('reservas')
  getBookingsFuture() {
    return this.bookingService.getBookingsFuture();
  }
  @Post()
  createBooking(@Body() booking: CreateBookingDto) {
    return this.bookingService.createBooking(booking);
  }
  @Patch('/:id')
  updateBooking(@Param('id') id: string, @Body() booking: UpdateBookingDto) {
    return this.bookingService.updateBooking(id, booking);
  }
  @Delete('/:id')
  deleteBooking(@Param('id') id: string) {
    return this.bookingService.deleteBooking(id);
  }
  @Delete()
  deleteAllBooking() {
    return this.bookingService.deleteAllBooking();
  }
  @Get('suit/:id')
  getBookingsBySuit(@Param('id') id: string) {
    return this.bookingService.getBookingsBySuit(id);
  }
  @Get('suit/:id/fechas')
  getDatesBySuit(
    @Param('id') id: string,
    @Query('dressmaker') dressmaker?: string,
  ) {
    return this.bookingService.getBusyDatesBySuit(id, dressmaker === 'true');
  }
  @Patch('/:id/estados')
  updateBokingAndSuit(
    @Param('id') booking_id: string,
    @Body()
    states: {
      booking_state: 'ACTIVED' | 'CANCELED' | 'COMPLETED' | 'INPROGRESS';
      suit_state: SuitState;
      booking_return_suit?: Date;
      booking_retired_suit?: Date;
    },
  ) {
    return this.bookingService.updateBookingAndSuit(
      +booking_id,
      states.booking_state,
      states.suit_state,
      states.booking_return_suit,
      states.booking_retired_suit,
    );
  }
}
