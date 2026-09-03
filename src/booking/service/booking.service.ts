import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { differenceInHours } from 'date-fns';
import { Booking } from 'src/booking/entity/booking.entity';
import { Suit } from 'src/suit/entity/suit.entity';
import { SuitState } from 'src/utils/suit_utils';
import {
  DataSource,
  In,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Suit) private suitRepository: Repository<Suit>,
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    private dataSource: DataSource,
  ) {}

  async createBooking(booking: CreateBookingDto) {
    //TODO logica de verificar la reserva ya realizada para una fecha y un traje
    const suitFound: Suit = await this.suitRepository.findOne({
      where: { id: booking.suit.id },
    });
    if (!suitFound) {
      throw new HttpException('Suit Not Found', HttpStatus.NOT_FOUND);
    }
    const newBooking = this.bookingRepository.create(booking);

    const match = String(booking.booking_date).match(
      /^(\d{4})-(\d{2})-(\d{2})T?/,
    );
    if (match) {
      Logger.log('Match', match);

      const [, year, month, day] = match;
      newBooking.booking_date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        3,
      );
    } else {
      throw new HttpException('Wrong Date', HttpStatus.BAD_REQUEST);
    }

    /* if (newBooking.booking_date < startOfDay(new Date())) {
      throw new HttpException('Date Not Valid', HttpStatus.BAD_REQUEST);
    } */
    this.calculateStartDate(newBooking);
    this.calculateEndDate(newBooking);
    const duplicate = await this.bookingRepository.findOne({
      where: {
        suit: { id: suitFound.id },
        booking_date: newBooking.booking_date,
        booking_state: 'ACTIVED',
      },
    });
    if (duplicate) {
      throw new HttpException('Booking Already Exists', HttpStatus.CONFLICT);
    }
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
    console.log(bookingFound);

    if (!bookingFound) {
      throw new HttpException('Booking Not Found', HttpStatus.NOT_FOUND);
    }

    if (booking.suit) {
      const suitFound = await this.suitRepository.findOne({
        where: { id: booking.suit.id },
      });
      if (!suitFound) {
        throw new HttpException('Suit Not Found', HttpStatus.NOT_FOUND);
      }
      booking.suit = suitFound;
    }
    delete booking.booking_date;
    Object.assign(bookingFound, booking);

    try {
      return await this.bookingRepository.save(bookingFound);
    } catch (e) {
      throw new HttpException('Error updating booking', HttpStatus.BAD_REQUEST);
    }
  }
  async deleteBooking(id: string) {
    const bookingFound = await this.bookingRepository.findOne({
      where: { id: Number(id) },
    });
    if (!bookingFound) {
      throw new HttpException('Booking Not Found', HttpStatus.NOT_FOUND);
    }
    Object.assign(bookingFound, { booking_state: 'CANCELED' });
    await this.bookingRepository.save(bookingFound);
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
    const bookings = await this.bookingRepository.find({
      where: {
        suit: suitFound,
        booking_state: In(['ACTIVED', 'INPROGRESS', 'COMPLETED']),
      },
      relations: {
        suit: true,
      },
    });
    return bookings;
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

  async getBusyDatesBySuit(id: string, dressmaker?: boolean) {
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
        booking_state: In(['INPROGRESS', 'ACTIVED', 'COMPLETED']),
      },
      order: { booking_date: 'ASC' },
      relations: { suit: true },
    });

    const busyDates = { laundry: [], dressmaker: [], preparation: [], shadow: [] };

    for (let i = 0; i < bookings.length; i++) {
      const currentBooking: Booking = bookings[i];
      const end_at = new Date(currentBooking.end_at);
      const booking_date = new Date(currentBooking.booking_date);
      const datesInRangeLaundry = getDatesInRangeLaundry(booking_date, end_at);
      const preparation_date = new Date(booking_date);
      preparation_date.setDate(booking_date.getDate() - 1);
      const shadowStart = new Date(booking_date);
      shadowStart.setDate(booking_date.getDate() - 1 - Number(process.env.LAUNDRY));
      const shadowDates = getDatesInRangeDressmaker(shadowStart, preparation_date);
      busyDates.laundry = [...busyDates.laundry, ...datesInRangeLaundry];
      busyDates.preparation = [...busyDates.preparation, preparation_date];
      busyDates.shadow = [...busyDates.shadow, ...shadowDates];
      if (currentBooking.dressmaker) {
        busyDates.dressmaker = [...busyDates.dressmaker, preparation_date];
      }
    }
    return busyDates;
  }

  deleteAllBooking() {
    return this.bookingRepository.clear();
  }

  //UTILS
  calculateStartDate(booking: Booking) {
    const start_date = new Date(booking.booking_date);
    start_date.setDate(start_date.getDate() - 1);
    start_date.setHours(15, 0, 0, 0);
    booking.start_at = start_date;
  }
  calculateEndDate(booking: Booking) {
    const end_date = new Date(booking.booking_date);
    end_date.setDate(end_date.getDate() + Number(process.env.LAUNDRY));
    end_date.setHours(23, 59, 59);
    booking.end_at = end_date;
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
        booking_state: In(['ACTIVED', 'INPROGRESS']),
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

  async updateBookingAndSuit(
    booking_id: number,
    booking_state: 'ACTIVED' | 'CANCELED' | 'COMPLETED' | 'INPROGRESS',
    suit_state: SuitState,
    booking_return_suit: Date,
    booking_retired_suit: Date,
  ) {
    try {
      const res = await this.dataSource.transaction(async (manager) => {
        const booking = await manager.getRepository(Booking).findOne({
          where: {
            id: booking_id,
          },
          relations: ['suit'],
        });

        const suit = booking.suit;
        booking.booking_state = booking_state;
        booking.booking_return_suit = booking_return_suit;
        booking.booking_retired_suit = booking_retired_suit;
        booking.suit.state = suit_state;
        suit.state = suit_state;

        return {
          booking: await manager.save(booking),
          suit: await manager.save(suit),
        };
      });
      return res;
    } catch (err) {
      throw new HttpException('Error updating booking', HttpStatus.BAD_REQUEST);
    }
  }

  getBookingsFuture = async (): Promise<Booking[]> => {
    const bookings = await this.bookingRepository.find({
      where: {
        booking_state: 'ACTIVED',
        booking_date: MoreThan(new Date()),
      },
      relations: ['suit'],
    });
    return bookings;
  };
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
