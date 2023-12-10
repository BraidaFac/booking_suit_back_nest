import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { SuitCategory, SuitState } from 'src/utils/suit_utils';

export class CreateSuitDto {
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  brand: string;
  @IsEnum(SuitCategory)
  @IsNotEmpty()
  category: SuitCategory;
  @IsOptional()
  @IsEnum(SuitState)
  state?: SuitState;
  @IsOptional()
  image?: string;
  @IsNotEmpty()
  @IsString()
  color: string;
}
