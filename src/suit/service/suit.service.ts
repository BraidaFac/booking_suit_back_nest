import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Suit } from '../entity/suit.entity';
import { Repository } from 'typeorm';
import { CreateSuitDto } from '../dto/create-suit.dto';
import { UpdateSuitDto } from '../dto/update-suit.dto';
import { SuitState } from 'src/utils/suit_utils';
@Injectable()
export class SuitService {
  constructor(
    @InjectRepository(Suit) private suitRepository: Repository<Suit>,
  ) {}
  getSuits() {
    return this.suitRepository.find({
      relations: {
        bookings: true,
      },
    });
  }

  async createSuit(suit: CreateSuitDto) {
    const suitFound = await this.suitRepository.findOne({
      where: { id: suit.id },
    });
    if (suitFound)
      throw new HttpException('Suit already exists', HttpStatus.CONFLICT);
    const newSuit = this.suitRepository.create(suit);
    return this.suitRepository.save(newSuit);
  }

  async getSuit(id: string) {
    const suitFound = await this.suitRepository.findOne({ where: { id } });
    if (!suitFound) {
      throw new HttpException('Suit not found', HttpStatus.NOT_FOUND);
    }
    return suitFound;
  }

  async deleteSuit(id: string) {
    const suitFound = await this.suitRepository.findOne({
      where: { id },
      relations: ['bookings'],
    });
    if (!suitFound) {
      throw new HttpException('Suit not found', HttpStatus.NOT_FOUND);
    }
    const active_bookings = suitFound.bookings.filter(
      (booking) =>
        booking.booking_state === 'ACTIVED' ||
        booking.booking_state === 'INPROGRESS',
    );
    if (active_bookings.length > 0) {
      throw new HttpException(
        'Suit has active bookings',
        HttpStatus.BAD_REQUEST,
      );
    }
    const res = await this.suitRepository.remove(suitFound);

    if (!res) {
      throw new HttpException(
        'Error deleting suit',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return {
      message: 'Suit Deleted successfully',
    };
  }
  async updateSuit(id: string, suit: UpdateSuitDto) {
    const suitFound = await this.suitRepository.findOne({ where: { id } });
    if (!suitFound) {
      throw new HttpException('Suit not found', HttpStatus.NOT_FOUND);
    }
    Object.assign(suitFound, suit);
    try {
      return await this.suitRepository.save(suitFound);
    } catch (e) {
      throw new HttpException('Error updating suit', HttpStatus.BAD_REQUEST);
    }
  }

  async getSuitToLoundry() {
    const suitsToLoundry = await this.suitRepository.find({
      where: { state: SuitState.ENLOCALSUCIO },
    });
    if (suitsToLoundry.length > 0) {
      return suitsToLoundry;
    } else {
      return [];
    }
  }

  async getSuitToTakeLoundry() {
    const suitsToTakeLoundry = await this.suitRepository.find({
      where: { state: SuitState.LAVANDERIALIMPIO },
    });
    if (suitsToTakeLoundry.length > 0) {
      return suitsToTakeLoundry;
    } else {
      return [];
    }
  }
  async getSuitsInLoundry() {
    const suitsInLoundry = await this.suitRepository.find({
      where: { state: SuitState.LAVANDERIASUCIO },
    });
    if (suitsInLoundry.length > 0) {
      return suitsInLoundry;
    } else {
      return [];
    }
  }
  async getFreeSuits(date_string: string) {
    const date_splited = date_string.split('-');

    const date = new Date(
      +date_splited[2],
      +date_splited[1] - 1,
      +date_splited[0],
    );
    date.setHours(0, 0, 0, 0);
    const date_end = new Date(date);
    date_end.setDate(+date_splited[0] + 3);
    date_end.setHours(0, 0, 0, 0);
    const date_start = new Date(date);
    date_start.setDate(+date_splited[0] - 1);
    date_start.setHours(0, 0, 0, 0);

    const suits = await this.suitRepository.find({
      relations: ['bookings'],
    });
    const suits_avaliable = suits
      .map((suit: Suit) => {
        suit.bookings = suit.bookings.filter(
          (booking) =>
            booking.booking_state === 'ACTIVED' ||
            booking.booking_state === 'INPROGRESS',
        );
        return suit;
      })
      .filter((suit: Suit) => {
        console.log(suit.bookings);

        const bookings = suit.bookings.filter((booking) => {
          const booking_start = new Date(booking.start_at);
          booking_start.setHours(0, 0, 0, 0);
          const booking_end = new Date(booking.end_at);
          booking_end.setHours(0, 0, 0, 0);
          return date_end >= booking_start && date_start <= booking_end;
        });
        return bookings.length === 0;
      });

    return suits_avaliable;
  }
}
