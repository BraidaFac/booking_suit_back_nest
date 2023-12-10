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

@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}
  @Get()
  getBookings() {
    return this.bookingService.getBooking();
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
    @Query('modista') dressmaker: boolean,
  ) {
    return this.bookingService.getDatesBySuit(id, dressmaker);
  }
}
