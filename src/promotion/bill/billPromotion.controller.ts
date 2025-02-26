import { BillPromotionService } from './billPromotion.service';
import { MaGiamDTO } from './billPromotion.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

export class BillPromotionController {
  constructor(private readonly billPromotionService: BillPromotionService) {}

  @MessagePattern('bill-promotion_find-usable-user')
  async findUsable(@Payload() idKhachhang: string) {
    return this.billPromotionService.findUsable(idKhachhang);
  }

  @MessagePattern('bill-promotion_find')
  async find(@Payload() id: string) {
    if (id) {
      return this.billPromotionService.findOne(id);
    } else {
      return this.billPromotionService.findAll();
    }
  }

  @MessagePattern('bill-promotion_create')
  async create(@Payload() dto: MaGiamDTO) {
    return this.billPromotionService.create(dto);
  }

  @MessagePattern('bill-promotion_update')
  async update(@Payload() id: string, dto: Partial<MaGiamDTO>) {
    return this.billPromotionService.update(id, dto);
  }

  @MessagePattern('bill-promotion_delete')
  async delete(@Payload() id: string) {
    return this.billPromotionService.delete(id);
  }

  @MessagePattern('su_dung_ma_giam')
  async suDungMaGiam(
    @Payload()
    idKhachHang: string,
    dsVoucher: string[]
  ) {
    return this.billPromotionService.usingVoucher(idKhachHang, dsVoucher);
  }

  @MessagePattern('hoan_ma_giam')
  async hoanMaGiam(
    @Payload()
    idKhachHang: string,
    dsVoucher: string[]
  ) {
    return this.billPromotionService.usingVoucher(idKhachHang, dsVoucher, true);
  }
}
