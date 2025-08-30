import { Module } from '@nestjs/common';
import { SuitModule } from './suit/suit.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingModule } from './booking/booking.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      username: DB_USER,
      password: DB_PASSWORD,
      host: DB_HOST,
      port: +DB_PORT,
      database: DB_NAME,
      entities: [__dirname + '/**/**/*.entity{.ts,.js}'],
    }),
    SuitModule,
    BookingModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
