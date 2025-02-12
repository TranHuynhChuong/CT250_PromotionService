import {
  IsDate,
  IsInt,
  IsString,
  Min,
  Max,
  ValidateIf,
  MaxLength,
  MinLength,
  IsArray,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';

export class CreateKhuyenMaiDto {
  @IsString()
  ma_KM: string; // Mã khuyến mãi

  @IsString()
  @MinLength(10)
  @MaxLength(100)
  ten_KM: string; // Mã khuyến mãi

  @IsDate()
  ngayBatDau_KM: Date; // Ngày bắt đầu

  @IsDate()
  ngayKetThuc_KM: Date; // Ngày kết thúc

  @IsArray()
  @IsString()
  @Transform(({ value }): string[] =>
    typeof value === 'string' ? [value] : value
  )
  @ValidateIf((o) => !o.idNganhHang_KM) // Bắt buộc nếu idNganhHang_KM không có
  idSanPham_KM?: string[]; // ID sản phẩm

  @IsString()
  @Transform(({ value }): string[] =>
    typeof value === 'string' ? [value] : value
  )
  @ValidateIf((o) => !o.idSanPham_KM) // Bắt buộc nếu idSanPham_KM không có
  idNganhHang_KM?: string[]; // ID ngành hàng

  @IsInt()
  @Min(1)
  soLuongSanPham_KM: number; // Số lượng tối đa

  @IsInt()
  @Min(1)
  gioiHanDatHang_KM: number; // Giới hạn đặt hàng

  @IsInt()
  @Min(1)
  @Max(99)
  @ValidateIf((o) => !o.mucGiamGia_KM) // Bắt buộc nếu mucGiamGia_KM không có
  tyLeGiamGia_KM?: number; // Giảm theo %

  @IsInt()
  @Min(1000)
  @Max(50000000)
  @ValidateIf((o) => !o.tyLeGiamGia_KM) // Bắt buộc nếu tyLeGiamGia_KM không có
  mucGiamGia_KM?: number; // Giảm theo số tiền
}

export class UpdateKhuyenMaiDto extends PartialType(CreateKhuyenMaiDto) {}
