import { KhuyenMaiService } from './productPromotion.service';
import {
  CreateKhuyenMaiDto,
  UpdateKhuyenMaiDto,
  CreateChiTietKhuyenMaiDto,
  UpdateChiTietKhuyenMaiDto,
} from './productPromotion.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

export class KhuyenMaiController {
  constructor(private readonly khuyenMaiService: KhuyenMaiService) {}

  @MessagePattern('product-promotion_create')
  async create(
    @Payload()
    payload: {
      khuyenMaiDto: CreateKhuyenMaiDto;
      chiTietKhuyenMaiDto: CreateChiTietKhuyenMaiDto[];
    }
  ) {
    return this.khuyenMaiService.create(
      payload.khuyenMaiDto,
      payload.chiTietKhuyenMaiDto
    );
  }

  @MessagePattern('product-promotion_update')
  async update(
    @Payload()
    payload: {
      idKhuyenMai: string;
      khuyenMaiDto: UpdateKhuyenMaiDto;
      chiTietKhuyenMaiDto: UpdateChiTietKhuyenMaiDto[];
    }
  ) {
    return this.khuyenMaiService.update(
      payload.idKhuyenMai,
      payload.khuyenMaiDto,
      payload.chiTietKhuyenMaiDto
    );
  }

  @MessagePattern('product-promotion_delete')
  async delete(
    @Payload()
    payload: {
      idKhuyenMai: string;
    }
  ) {
    return this.khuyenMaiService.delete(payload.idKhuyenMai);
  }

  @MessagePattern('product-promotion_get-active-promotions-by-productId')
  async getActivePromotionsByProductId(
    @Payload()
    payload: {
      idSanPham: string;
    }
  ) {
    return this.khuyenMaiService.getActiveByProductId(payload.idSanPham);
  }

  @MessagePattern('product-promotion_get-active-promotions-by-productIds')
  async getActivePromotionsByProductIds(
    @Payload()
    payload: {
      idSanPham: string[];
    }
  ) {
    return this.khuyenMaiService.getActiveByProductIds(payload.idSanPham);
  }

  @MessagePattern('product-promotion_get-products-in-promotion')
  async getProductsInPromotion(
    @Payload()
    payload: {
      idKhuyenMai: string;
    }
  ) {
    return this.khuyenMaiService.getProducts(payload.idKhuyenMai);
  }

  @MessagePattern('product-promotion_get-active-promotions')
  async getActivePromotions() {
    return this.khuyenMaiService.getAllActive();
  }

  @MessagePattern('product-promotion_find')
  async find(
    @Payload()
    payload: {
      id: string;
    }
  ) {
    if (payload.id) {
      return this.khuyenMaiService.findOne(payload.id);
    } else {
      return this.khuyenMaiService.getAll();
    }
  }

  @MessagePattern('giam_san_pham_khuyen_mai')
  async giamSoLuongSanPhamKhuyenMai(
    @Payload()
    payload: {
      dsSP: {
        idSanPham_CTHD: string;
        idTTBanHang_CTHD: string;
        soLuong_CTHD: number;
        giaMua_CTHD: number;
      }[];
    }
  ) {
    return this.khuyenMaiService.capNhatSoLuongSanPhamKhuyenMai(payload.dsSP);
  }

  @MessagePattern('hoan_san_pham_khuyen_mai')
  hoanSoLuongSanPhamKhuyenMai(
    @Payload()
    payload: {
      dsSP: {
        idSanPham_CTHD: string;
        idTTBanHang_CTHD: string;
        soLuong_CTHD: number;
        giaMua_CTHD: number;
      }[];
    }
  ) {
    return this.khuyenMaiService.capNhatSoLuongSanPhamKhuyenMai(
      payload.dsSP,
      true
    );
  }
}
