import { Module } from '@nestjs/common';
import { SuitModule } from './suit/suit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingModule } from './booking/booking.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      username: 'root',
      password: '1101',
      host: 'localhost',
      port: 3306,
      database: 'suit_bookings',
      entities: [__dirname + '/**/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    SuitModule,
    BookingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
