import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'ngayTao_KM', updatedAt: 'ngayCapNhat_KM' },
})
export class KHUYEN_MAI extends Document {
  @Prop({ required: true, unique: true })
  ma_KM: string; // Mã khuyến mãi (duy nhất)

  @Prop({ required: true, minlength: 10, maxlength: 100 })
  ten_KM: string; // ten khuyến mãi

  @Prop({ required: true })
  ngayBatDau_KM: Date; // Ngày bắt đầu

  @Prop({ required: true })
  ngayKetThuc_KM: Date; // Ngày kết thúc

  @Prop({ type: [String] })
  idSanPham_KM?: string[]; // ID sản phẩm (chỉ chọn một trong hai)

  @Prop({ type: [String] })
  idNganhHang_KM?: string[]; // ID ngành hàng (chỉ chọn một trong hai)

  @Prop({ required: true, min: 1 })
  soLuongSanPham_KM: number; // Số lượng tối đa áp dụng

  @Prop({ required: true, min: 1 })
  gioiHanDatHang_KM: number; // Giới hạn đặt hàng

  @Prop({ min: 1, max: 99 })
  tyLeGiamGia_KM?: number; // Giảm theo phần trăm

  @Prop({ min: 1000, max: 120000000 })
  mucGiamGia_KM?: number; // Giảm theo số tiền

  @Prop({ type: Boolean, default: false })
  coAnh_KM: boolean; // Có ảnh khuyến mãi hay không

  @Prop({ type: { public_id: String, url: String } })
  anh_KM?: { public_id: string; url: string };
}

export const KHUYEN_MAISchema = SchemaFactory.createForClass(KHUYEN_MAI);
