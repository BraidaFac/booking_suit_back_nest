import { Suit } from 'src/suit/entity/suit.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  booking_created: Date;
  @Column({ type: 'timestamp' })
  start_at: Date;
  @Column({ type: 'timestamp' })
  end_at: Date;
  @Column({ type: 'timestamp', nullable: true })
  booking_return_suit: Date;
  @Column({ type: 'timestamp', nullable: true })
  booking_retired_suit: Date;
  @Column({ type: 'timestamp' })
  booking_date: Date;
  @Column()
  booking_state: 'ACTIVED' | 'CANCELED' | 'COMPLETED' | 'INPROGRESS';
  @ManyToOne(() => Suit, (suit) => suit.bookings, { nullable: false })
  suit: Suit;
  @Column()
  client_dni: string;
  @Column()
  client_name: string;
  @Column()
  client_phone: string;
  @Column()
  account_related: string;
  @Column()
  observations: string;
  @Column({ default: false })
  dressmaker: boolean;
}
