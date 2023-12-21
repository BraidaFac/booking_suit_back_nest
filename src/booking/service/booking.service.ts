import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Booking } from '../entity/booking.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { Suit } from 'src/suit/entity/suit.entity';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { addDays, differenceInHours, getDay, startOfDay } from 'date-fns';
@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Suit) private suitRepository: Repository<Suit>,
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
  ) {}

  async createBooking(booking: CreateBookingDto) {
    //TODO logica de verificar la reserva ya realizada para una fecha y un traje
    const suitFound = await this.suitRepository.findOne({
      where: { id: booking.suit.id },
    });
    if (!suitFound) {
      return new HttpException('Suit Not Found', HttpStatus.NOT_FOUND);
    }
    const newBooking = this.bookingRepository.create(booking);

    const match = String(booking.booking_date).match(
      /^(\d{4})-(\d{2})-(\d{2})T?/,
    );
    if (match) {
      const [, year, month, day] = match;
      newBooking.booking_date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
      );
    } else {
      throw new HttpException('Wrong Date', HttpStatus.BAD_REQUEST);
    }

    if (newBooking.booking_date < startOfDay(new Date())) {
      return new HttpException('Date Not Valid', HttpStatus.BAD_REQUEST);
    }
    this.calculateStartDate(newBooking);
    this.calculateEndDate(newBooking);
    if (!(await this.verifyDisponibility(newBooking))) {
      throw new HttpException('Suit Not Available', HttpStatus.BAD_REQUEST);
    }
    newBooking.suit = suitFound;
    newBooking.booking_state = 'ACTIVED';
    return this.bookingRepository.save(newBooking);
  }

  getBooking() {
    return this.bookingRepository.find({
      relations: {
        suit: true,
      },
    });
  }
  async updateBooking(id: string, booking: UpdateBookingDto) {
    const bookingFound = await this.bookingRepository.findOne({
      where: { id: Number(id) },
    });
    if (!bookingFound) {
      return new HttpException('Booking Not Found', HttpStatus.NOT_FOUND);
    }

    if (booking.suit) {
      const suitFound = await this.suitRepository.findOne({
        where: { id: booking.suit.id },
      });
      if (!suitFound) {
        return new HttpException('Suit Not Found', HttpStatus.NOT_FOUND);
      }
      booking.suit = suitFound;
    }
    return this.bookingRepository.update({ id: Number(id) }, booking);
  }
  async deleteBooking(id: string) {
    const bookingFound = await this.bookingRepository.findOne({
      where: { id: Number(id) },
    });
    if (!bookingFound) {
      throw new HttpException('Booking Not Found', HttpStatus.NOT_FOUND);
    }
    this.bookingRepository.remove(bookingFound);
    return {
      message: 'Booking deleted successfully',
    };
  }
  async getBookingsBySuit(id: string) {
    const suitFound = await this.suitRepository.findOne({
      where: { id },
    });
    if (!suitFound) {
      throw new HttpException('Suit Not Found', HttpStatus.NOT_FOUND);
    }
    return this.bookingRepository.find({
      where: { suit: suitFound },
      relations: {
        suit: true,
      },
    });
  }
  async cancelBookings(id: string) {
    const bookingFound = await this.bookingRepository.findOne({
      where: { id: Number(id) },
    });
    if (!bookingFound) {
      throw new HttpException('Booking Not Found', HttpStatus.NOT_FOUND);
    }
    bookingFound.booking_state = 'CANCELED';
    return this.bookingRepository.save(bookingFound);
  }

  async getDatesBySuit(id: string, dressmaker?: boolean) {
    const suitFound = await this.suitRepository.findOne({
      where: { id },
    });
    if (!suitFound) {
      return new HttpException('Suit Not Found', HttpStatus.NOT_FOUND);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookings = await this.bookingRepository.find({
      where: {
        suit: suitFound,
        booking_state: 'ACTIVED',
        booking_date: MoreThanOrEqual(today),
      },
      order: { booking_date: 'ASC' },
      relations: { suit: true },
    });
    const QUANTITY_OF_DAYS = dressmaker ? 48 : 24;

    const availableDates = [];
    for (let i = 0; i < bookings.length; i++) {
      if (i === bookings.length - 1) {
        availableDates.push({
          start: bookings[i].end_at,
        });
        break;
      } // Si es el último elemento del array, no se puede comparar con el siguiente (i + 1
      const currentBooking: Booking = bookings[i];
      const nextBooking: Booking = bookings[i + 1];
      const timeDiff = differenceInHours(
        nextBooking.start_at,
        currentBooking.end_at,
      );
      if (timeDiff >= 120) {
        for (let j = 1; j <= timeDiff / 24; j++) {
          const date = new Date(currentBooking.end_at);
          date.setHours(0, 0, 0, 0);
          const free_day = addDays(date, j);
          if (
            this.verifyPreviousBooking(
              free_day,
              currentBooking.end_at,
              QUANTITY_OF_DAYS,
            ) &&
            this.verifyPostBooking(free_day, nextBooking.start_at)
          )
            availableDates.push(free_day);
        }
      }
    }
    return availableDates;
  }

  async getBusyDatesBySuit(id: string) {
    const suitFound = await this.suitRepository.findOne({
      where: { id },
    });
    if (!suitFound) {
      throw new HttpException('Suit Not Found', HttpStatus.NOT_FOUND);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookings = await this.bookingRepository.find({
      where: {
        suit: suitFound,
        booking_state: 'ACTIVED',
        booking_date: MoreThanOrEqual(today),
      },
      order: { booking_date: 'ASC' },
      relations: { suit: true },
    });

    const busyDates = { laundry: [], dressmaker: [], preparation: [] };

    for (let i = 0; i < bookings.length; i++) {
      const currentBooking: Booking = bookings[i];
      const start_at = new Date(currentBooking.start_at);
      const end_at = new Date(currentBooking.end_at);
      const booking_date = new Date(currentBooking.booking_date);
      const datesInRangeLaundry = getDatesInRangeLaundry(booking_date, end_at);
      const preparation_date = new Date(currentBooking.booking_date);
      preparation_date.setDate(booking_date.getDate() - 1);
      if (currentBooking.dressmaker) {
        const datesInRangeDressmaker = getDatesInRangeDressmaker(
          start_at,
          preparation_date,
        );
        busyDates.dressmaker = [
          ...busyDates.dressmaker,
          ...datesInRangeDressmaker,
        ];
      }
      busyDates.laundry = [...busyDates.laundry, ...datesInRangeLaundry];
      busyDates.preparation = [...busyDates.preparation, preparation_date];
    }
    return busyDates;
  }

  deleteAllBooking() {
    return this.bookingRepository.clear();
  }
  //UTILS
  calculateStartDate(booking: Booking) {
    if (booking.dressmaker) {
      const start_date = new Date(booking.booking_date);
      start_date.setDate(start_date.getDate() - 2);
      start_date.setHours(12, 0, 0, 0);
      booking.start_at = start_date;
    } else {
      const start_date = new Date(booking.booking_date);
      start_date.setDate(start_date.getDate() - 1);
      start_date.setHours(15, 0, 0, 0);
      booking.start_at = start_date;
    }
  }
  calculateEndDate(booking: Booking) {
    if (
      getDay(booking.booking_date) === 4 ||
      getDay(booking.booking_date) === 5 ||
      getDay(booking.booking_date) === 6
    ) {
      const end_date = new Date(booking.booking_date);
      end_date.setDate(end_date.getDate() + Number(process.env.LAUNDRY) + 1);
      end_date.setHours(23, 59, 59);
      booking.end_at = end_date;
    } else {
      const end_date = new Date(booking.booking_date);
      end_date.setDate(end_date.getDate() + Number(process.env.LAUNDRY));
      end_date.setHours(23, 59, 59);
      booking.end_at = end_date;
    }
  }

  async verifyDisponibility(booking: Booking) {
    let hsDiffBefore: number;
    let hsDiffAfter: number;
    //En booking_after estaran tambien las reservas de ese mism dia.
    const bookings_after = await this.bookingRepository.find({
      where: {
        booking_state: 'ACTIVED',
        suit: booking.suit,
        booking_date: MoreThanOrEqual(booking.booking_date),
      },
      order: { booking_date: 'ASC' },
    });
    const bookings_before = await this.bookingRepository.find({
      where: {
        booking_state: 'ACTIVED',
        suit: booking.suit,
        booking_date: LessThan(booking.booking_date),
      },
      order: { booking_date: 'DESC' },
    });
    if (bookings_after.length === 0 && bookings_before.length === 0) {
      return true;
    } else if (bookings_after.length === 0) {
      const before_booking = bookings_before[0];
      hsDiffBefore = differenceInHours(booking.start_at, before_booking.end_at);
      console.log(hsDiffBefore);
      if (hsDiffBefore >= 12) {
        return true;
      } else return false;
    } else if (bookings_before.length === 0) {
      const next_booking = bookings_after[0];
      hsDiffAfter = differenceInHours(next_booking.start_at, booking.end_at);
      if (hsDiffAfter >= 12) {
        return true;
      } else return false;
    } else {
      const before_booking = bookings_before[0];
      const next_booking = bookings_after[0];
      hsDiffBefore = differenceInHours(booking.start_at, before_booking.end_at);
      hsDiffAfter = differenceInHours(next_booking.start_at, booking.end_at);
    }
    if (hsDiffBefore >= 12 && hsDiffAfter >= 12) {
      return true;
    }
    return false;
  }

  verifyPreviousBooking(
    free_day: Date,
    end_at: Date,
    QUANTITY_OF_DAYS: number,
  ) {
    const hsDiff = differenceInHours(free_day, end_at);
    if (hsDiff >= QUANTITY_OF_DAYS) {
      return true;
    } else return false;
  }
  verifyPostBooking(free_day: Date, start_at: Date) {
    const hsDiff = differenceInHours(start_at, free_day);
    if (
      getDay(free_day) === 4 ||
      getDay(free_day) === 5 ||
      getDay(free_day) === 6
    ) {
      if (hsDiff >= 96) {
        return true;
      } else return false;
    }
    if (hsDiff >= 72) {
      return true;
    } else return false;
  }
}
function getDatesInRangeDressmaker(firstDay, endDate) {
  const datesInRange = [];
  const currentDate = new Date(firstDay);

  while (currentDate < endDate) {
    datesInRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return datesInRange;
}
function getDatesInRangeLaundry(firstDay, endDate) {
  const datesInRange = [];
  const currentDate = new Date(firstDay);
  currentDate.setDate(currentDate.getDate() + 1);
  while (currentDate < endDate) {
    datesInRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return datesInRange;
}
