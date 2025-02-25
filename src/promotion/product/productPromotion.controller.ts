import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { KhuyenMaiService } from './productPromotion.service';
import {
  CreateKhuyenMaiDto,
  UpdateKhuyenMaiDto,
  CreateChiTietKhuyenMaiDto,
  UpdateChiTietKhuyenMaiDto,
} from './productPromotion.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('product-promotion')
export class KhuyenMaiController {
  constructor(private readonly khuyenMaiService: KhuyenMaiService) {}

  // Tạo khuyến mãi
  @Post()
  async createKhuyenMai(
    @Body('khuyenMai') khuyenMaiDto: CreateKhuyenMaiDto,
    @Body('chiTietKhuyenMai') chiTietKhuyenMaiDto: CreateChiTietKhuyenMaiDto[]
  ) {
    return this.khuyenMaiService.create(khuyenMaiDto, chiTietKhuyenMaiDto);
  }

  // Lấy khuyến mãi có hiệu lực cho sản phẩm
  @Get('product/:id')
  async findUsablePromotionOfProduct(
    @Param('id') idSanPham: string
  ): Promise<any> {
    return this.khuyenMaiService.getUsablePromotionOfProduct(idSanPham);
  }

  // Lấy tất cả khuyến mãi
  @Get()
  async findAll() {
    return this.khuyenMaiService.getAll();
  }

  @Get('products')
  async getProductsOfUsablePromotion() {
    return this.khuyenMaiService.getProductsOfUsablePromotion();
  }

  // Lấy chi tiết khuyến mãi theo ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.khuyenMaiService.find(id);
  }

  // Cập nhật khuyến mãi theo ID
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('khuyenMai') khuyenMaiDto: UpdateKhuyenMaiDto,
    @Body('chiTietKhuyenMai') chiTietKhuyenMaiDto: UpdateChiTietKhuyenMaiDto[]
  ) {
    return this.khuyenMaiService.update(id, khuyenMaiDto, chiTietKhuyenMaiDto);
  }

  // Xóa khuyến mãi theo ID
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.khuyenMaiService.delete(id);
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

  @MessagePattern('test1')
  test(
    @Payload()
    payload: {
      data: string;
    }
  ) {
    return payload.data;
  }
}
