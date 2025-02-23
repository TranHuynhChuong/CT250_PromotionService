import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'ngayTao_KM', updatedAt: 'ngayCapNhat_KM' },
})
export class KHUYEN_MAI extends Document {
  @Prop({ required: true, unique: true })
  ma_KM: string; // Mã khuyến mãi (duy nhất)

  @Prop({ required: true, minlength: 10, maxlength: 100 })
  ten_KM: string; // Tên khuyến mãi

  @Prop({ required: true })
  ngayBatDau_KM: Date; // Ngày bắt đầu

  @Prop({ required: true })
  ngayKetThuc_KM: Date; // Ngày kết thúc

  @Prop({ type: Boolean, default: false })
  coQuangBa_KM: boolean; // Có quảng bá khuyến mãi ở trang chủ hay không
}

export const KHUYEN_MAISchema = SchemaFactory.createForClass(KHUYEN_MAI);

@Schema()
export class CHI_TIET_KHUYEN_MAI extends Document {
  @Prop({ type: Types.ObjectId, ref: 'KHUYEN_MAI', required: true })
  idKhuyenMai_KM: Types.ObjectId; // Tham chiếu đến KHUYEN_MAI

  @Prop({ required: true })
  idSanPham_KM: string;

  @Prop({ required: true, default: null })
  soLuong_KM: number;

  @Prop({ required: true, default: null })
  gioiHanDatHang_KM: number;

  @Prop({ min: 1, max: 99 })
  tyLeGiam_KM?: number;

  @Prop({ min: 1000, max: 120000000 })
  mucGiam_KM?: number;
}

export const CHI_TIET_KHUYEN_MAISchema =
  SchemaFactory.createForClass(CHI_TIET_KHUYEN_MAI);
