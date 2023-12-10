import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Suit } from '../entity/suit.entity';
import { Repository } from 'typeorm';
import { CreateSuitDto } from '../dto/create-suit.dto';
import { UpdateSuitDto } from '../dto/update-suit.dto';

@Injectable()
export class SuitService {
  constructor(
    @InjectRepository(Suit) private suitRepository: Repository<Suit>,
  ) {}
  getSuits() {
    return this.suitRepository.find({});
  }

  async createSuit(suit: CreateSuitDto) {
    const suitFound = await this.suitRepository.findOne({
      where: { id: suit.id },
    });
    if (suitFound)
      return new HttpException('Suit already exists', HttpStatus.CONFLICT);
    const newSuit = this.suitRepository.create(suit);
    return this.suitRepository.save(newSuit);
  }

  async getSuit(id: string) {
    const suitFound = await this.suitRepository.findOne({ where: { id } });
    if (!suitFound) {
      return new HttpException('Suit not found', HttpStatus.NOT_FOUND);
    }
    return suitFound;
  }

  async deleteSuit(id: string) {
    const suitFound = await this.suitRepository.findOne({ where: { id } });
    if (!suitFound) {
      return new HttpException('Suit not found', HttpStatus.NOT_FOUND);
    }
    this.suitRepository.remove(suitFound);
    return {
      message: 'Suit Deleted successfully',
    };
  }
  async updateSuit(id: string, suit: UpdateSuitDto) {
    const suitFound = await this.suitRepository.findOne({ where: { id } });
    if (!suitFound) {
      return new HttpException('Suit not found', HttpStatus.NOT_FOUND);
    }
    return this.suitRepository.update({ id }, suit);
  }
}
