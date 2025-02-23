/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PartialType } from '@nestjs/mapped-types';
//import { Transform } from 'class-transformer';
import {
  // IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// DTO cho KHUYEN_MAI
export class CreateKhuyenMaiDto {
  @IsString()
  @MinLength(10)
  @MaxLength(100)
  ma_KM: string; // Mã khuyến mãi (duy nhất)

  @IsString()
  @MinLength(10)
  @MaxLength(100)
  ten_KM: string; // Tên khuyến mãi

  @IsDateString()
  ngayBatDau_KM: Date; // Ngày bắt đầu

  @IsDateString()
  ngayKetThuc_KM: Date; // Ngày kết thúc

  @IsBoolean()
  coQuangBa_KM: boolean; // Có quảng bá khuyến mãi hay không
}

// DTO cho CHI_TIET_KHUYEN_MAI
export class CreateChiTietKhuyenMaiDto {
  @IsString()
  idSanPham_KM: string; // ID sản phẩm

  @IsNumber()
  soLuong_KM: number; // Số lượng sản phẩm

  @IsNumber()
  gioiHanDatHang_KM: number; // Giới hạn đặt hàng

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  tyLeGiam_KM?: number; // Tỷ lệ giảm giá

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(120000000)
  mucGiam_KM?: number; // Mức giảm giá theo tiền
}

export class UpdateKhuyenMaiDto extends PartialType(CreateKhuyenMaiDto) {}
export class UpdateChiTietKhuyenMaiDto extends PartialType(
  CreateChiTietKhuyenMaiDto
) {}
