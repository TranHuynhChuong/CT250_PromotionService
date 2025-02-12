import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'ngayTao_MG', updatedAt: 'ngayCapNhat_MG' },
})
export class MA_GIAM extends Document {
  @Prop({ required: true, unique: true })
  ma_MG: string; // Mã giảm giá (duy nhất, do người dùng nhập)

  @Prop({ required: true, minlength: 10, maxlength: 100 })
  ten_MG: string; // Tên mã giảm giá (10-100 ký tự)

  @Prop({ required: true })
  ngayBatDau_MG: Date; // Ngày bắt đầu

  @Prop({ required: true })
  ngayKetThuc_MG: Date; // Ngày kết thúc

  @Prop({ required: true, min: 1, max: 100 })
  soLuong_MG: number; // Số lượng mã có thể sử dụng (tối đa 100)

  @Prop({ required: true, default: false })
  gioiHanSoLuong_MG: boolean; // Giới hạn số lượng mã (mặc định `false`)

  @Prop({ required: true, min: 1000, max: 120000000 })
  giaTriToiThieu_MG: number; // Giá trị tối thiểu hóa đơn để áp dụng mã giảm

  @Prop({ required: false, min: 1000, max: 120000000, default: null })
  mucGiamToiDa_MG?: number; // Số tiền tối đa mã có thể giảm

  @Prop({ required: false, min: 1, max: 99, default: null })
  tyLeGiam_MG?: number; // Tỷ lệ giảm giá (%)

  @Prop({ required: false, min: 1000, max: 120000000, default: null })
  mucGiam_MG?: number; // Giảm theo số tiền cụ thể

  @Prop({ required: true, min: 0, max: 5 })
  gioiHanLuotDung_MG: number; // Giới hạn số lần sử dụng trên mỗi người dùng

  @Prop({ required: true, default: false })
  maVanChuyen_MG: boolean; // Mã giảm giá vận chuyển (mặc định `false`)

  @Prop({ required: true, default: true })
  maHoaDon_MG: boolean; // Mã giảm giá hóa đơn (mặc định `true`)
}

export const MA_GIAMSchema = SchemaFactory.createForClass(MA_GIAM);
