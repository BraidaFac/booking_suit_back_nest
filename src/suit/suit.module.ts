import { Module } from '@nestjs/common';
import { SuitController } from './controller/suit.controller';
import { SuitService } from './service/suit.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Suit } from './entity/suit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Suit])],
  controllers: [SuitController],
  providers: [SuitService],
})
export class SuitModule {}
