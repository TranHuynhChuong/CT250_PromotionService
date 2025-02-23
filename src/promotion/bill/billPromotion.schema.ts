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

  @Prop({ required: true, min: 1, max: 100, default: null })
  soLuong_MG: number; // Số lượng mã có thể sử dụng (tối đa 100)

  @Prop({ required: true, min: 0, max: 5, default: null })
  gioiHanLuotDung_MG: number; // Giới hạn số lần sử dụng trên mỗi người dùng

  @Prop({ required: true, default: 0 })
  loaiMa_MG: number; // 0: Mã giảm hóa đơn, 1: mã giảm vận chuyển

  @Prop({ required: true, min: 1000, max: 120000000, default: null })
  giaTriToiThieu_MG: number; // Giá trị tối thiểu hóa đơn để áp dụng mã giảm

  @Prop({ required: false, min: 1, max: 99, default: null })
  tyLeGiam_MG?: number; // Tỷ lệ giảm giá (%)

  @Prop({ required: false, min: 1000, max: 120000000, default: null })
  mucGiam_MG?: number; // Giảm theo số tiền cụ thể

  @Prop({
    type: [
      {
        idKhachHang: { type: String, required: true }, // ID khách hàng (string)
        soLan: { type: Number, default: 0, min: 0 }, // Số lần sử dụng
      },
    ],
    default: [],
  })
  daDung_MG: {
    idKhachHang: string;
    soLan: number;
  }[];
}

export const MA_GIAMSchema = SchemaFactory.createForClass(MA_GIAM);
