import {
  Controller,
  Get,
  Body,
  Post,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateSuitDto } from '../dto/create-suit.dto';
import { SuitService } from '../service/suit.service';
import { UpdateSuitDto } from '../dto/update-suit.dto';
import { AuthGuard } from 'src/auth/auth.guard';
@Controller('suit')
export class SuitController {
  constructor(private suitService: SuitService) {}
  @Get()
  getSuits() {
    return this.suitService.getSuits();
  }
  @Get('loundry')
  getSuitToLoundry() {
    return this.suitService.getSuitToLoundry();
  }
  @Get('/:id')
  getOneSuit(@Param('id') id: string) {
    return this.suitService.getSuit(id);
  }
  @Post()
  createSuit(@Body() suit: CreateSuitDto) {
    return this.suitService.createSuit(suit);
  }
  @Delete('/:id')
  deleteSuit(@Param('id') id: string) {
    return this.suitService.deleteSuit(id);
  }
  @Patch('/:id')
  updateSuit(@Param('id') id: string, @Body() suit: UpdateSuitDto) {
    return this.suitService.updateSuit(id, suit);
  }
  @Get('free/:date')
  getFreeSuits(@Param('date') date: string) {
    return this.suitService.getFreeSuits(date);
  }
}
