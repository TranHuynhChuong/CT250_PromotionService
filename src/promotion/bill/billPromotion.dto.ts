import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsNumber,
} from 'class-validator';

// ✅ Custom Validator: Kiểm tra ngayKetThuc_MG > ngayBatDau_MG
@ValidatorConstraint({ name: 'isEndDateValid', async: false })
export class IsEndDateValid implements ValidatorConstraintInterface {
  validate(ngayKetThuc_MG: Date, args: ValidationArguments) {
    const obj = args.object as any;
    return (
      typeof obj.ngayBatDau_MG === 'object' &&
      ngayKetThuc_MG > obj.ngayBatDau_MG
    );
  }

  defaultMessage() {
    return 'ngayKetThuc_MG phải lớn hơn ngayBatDau_MG';
  }
}
export class MaGiamDTO {
  @IsString()
  @IsNotEmpty()
  ma_MG: string; // Mã giảm giá

  @IsString()
  @IsNotEmpty()
  ten_MG: string; // Tên mã giảm giá

  @IsDate()
  @Type(() => Date)
  ngayBatDau_MG: Date;

  @IsDate()
  @Type(() => Date)
  @Validate(IsEndDateValid)
  ngayKetThuc_MG: Date; // Ngày kết thúc (phải lớn hơn ngày bắt đầu)

  @IsInt()
  @Min(1)
  @Max(100)
  soLuong_MG: number; // Số lượng mã (tối đa 100)

  @IsBoolean()
  gioiHanSoLuong_MG: boolean; // Giới hạn số lượng mã (mặc định `false`)

  @IsInt()
  @Min(1000)
  @Max(120000000)
  giaTriToiThieu_MG: number; // Giá trị tối thiểu hóa đơn

  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  tyLeGiam_MG?: number; // Tỷ lệ giảm giá (%)

  @IsInt()
  @Min(1000)
  @Max(120000000)
  @IsOptional()
  @ValidateIf((o) => !o.tyLeGiam_MG && !o.mucGiam_MG)
  mucGiam_MG?: number; // Số tiền giảm cụ thể

  @IsInt()
  @Min(0)
  @Max(10)
  gioiHanLuotDung_MG: number; // Giới hạn lượt sử dụng trên mỗi người dùng

  @IsNumber()
  loaiMa_MG: number; // Mã giảm giá vận chuyển
}
