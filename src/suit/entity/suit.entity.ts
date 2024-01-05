import { Booking } from 'src/booking/entity/booking.entity';
import { SuitCategory, SuitState } from 'src/utils/suit_utils';
import { Column, Entity, OneToMany } from 'typeorm';
@Entity()
export class Suit {
  @Column({ unique: true, primary: true })
  id: string;
  @Column()
  brand: string;
  @Column()
  category: SuitCategory;
  @Column({ default: SuitState.ENLOCALLMPIO })
  state: SuitState;
  @Column({ nullable: true })
  image: string;
  @OneToMany(() => Booking, (booking) => booking.suit)
  bookings: Booking[];
  @Column()
  color: string;
}
