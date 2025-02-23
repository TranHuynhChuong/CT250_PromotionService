import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { BillPromotionService } from './billPromotion.service';
import { MaGiamDTO } from './billPromotion.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('bill-promotion')
export class BillPromotionController {
  constructor(private readonly billPromotionService: BillPromotionService) {}

  @Get('user/:id')
  async findAll(@Param('id') idKhachhang: string) {
    return this.billPromotionService.findUsable(idKhachhang);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (id) {
      return this.billPromotionService.findOne(id);
    } else {
      return this.billPromotionService.findAll();
    }
  }

  @Post()
  async create(@Body() dto: MaGiamDTO) {
    return this.billPromotionService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<MaGiamDTO>) {
    return this.billPromotionService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.billPromotionService.delete(id);
  }

  @MessagePattern('su_dung_ma_giam')
  async suDungMaGiam(
    @Payload()
    payload: {
      idKhachHang: string;
      dsVoucher: string[];
    }
  ) {
    return this.billPromotionService.usingVoucher(
      payload.idKhachHang,
      payload.dsVoucher
    );
  }

  @MessagePattern('hoan_ma_giam')
  async hoanMaGiam(
    @Payload()
    payload: {
      idKhachHang: string;
      dsVoucher: string[];
    }
  ) {
    return this.billPromotionService.usingVoucher(
      payload.idKhachHang,
      payload.dsVoucher,
      true
    );
  }
}
