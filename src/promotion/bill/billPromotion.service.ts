import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MA_GIAM } from './billPromotion.schema';
import { MaGiamDTO } from './billPromotion.dto';

@Injectable()
export class BillPromotionService {
  constructor(
    @InjectModel(MA_GIAM.name) private readonly maGiamModel: Model<MA_GIAM>
  ) {}

  async findAll(): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const data = await this.maGiamModel.find().exec();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async findOne(
    id: string
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const data = await this.maGiamModel.findById(id).exec();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async findActive(): Promise<{
    success: boolean;
    data?: any;
    error?: any;
  }> {
    try {
      const now = new Date();
      const data = await this.maGiamModel
        .find({
          ngayBatDau_MG: { $lte: now },
          ngayKetThuc_MG: { $gte: now },
        })
        .exec();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async findUsable(
    idKhachHang: string
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const now = new Date();
      const activeVouchers = await this.maGiamModel
        .find({
          ngayBatDau_MG: { $lte: now },
          ngayKetThuc_MG: { $gte: now },
        })
        .exec();

      const usableVouchers = activeVouchers.filter((voucher) => {
        const usedInfo = voucher.daDung_MG.find(
          (entry) => entry.idKhachHang === idKhachHang
        );
        return !usedInfo || usedInfo.soLan < voucher.gioiHanLuotDung_MG;
      });

      return { success: true, data: usableVouchers };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async create(
    dto: MaGiamDTO
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const existing = await this.maGiamModel
        .findOne({ ma_MG: dto.ma_MG })
        .exec();
      if (existing) {
        throw new InternalServerErrorException('Mã giảm giá đã tồn tại');
      }
      const newMaGiam = new this.maGiamModel(dto);
      const data = await newMaGiam.save();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async update(
    id: string,
    dto: Partial<MaGiamDTO>
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const data = await this.maGiamModel
        .findByIdAndUpdate(id, dto, { new: true })
        .exec();
      if (!data) {
        throw new NotFoundException('Mã giảm giá không tồn tại');
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const result = await this.maGiamModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException('Mã giảm giá không tồn tại');
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async usingVoucher(
    idKhachHang: string,
    dsVoucher: string[],
    hoanLai: boolean = false
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    const now = new Date();
    try {
      const vouchers: MA_GIAM[] = [];
      for (const mg of dsVoucher) {
        const voucher = await this.maGiamModel.findById(mg);
        if (!voucher) {
          throw new NotFoundException(`Mã giảm giá ${mg} không tồn tại`);
        }

        // Kiểm tra mã có còn hiệu lực không
        if (voucher.ngayBatDau_MG > now || voucher.ngayKetThuc_MG < now) {
          throw new NotFoundException(`Mã giảm giá ${mg} không còn hiệu lực`);
        }

        // Kiểm tra mã giảm còn lượt sử dụng không
        if (voucher.soLuong_MG && voucher.soLuong_MG <= 0) {
          throw new NotFoundException(`Mã giảm giá ${mg} đã hết lượt sử dụng`);
        }
        // Tìm thông tin sử dụng của người dùng
        const usedIndex = voucher.daDung_MG.findIndex(
          (user) => user.idKhachHang === idKhachHang
        );

        if (!hoanLai) {
          if (usedIndex !== -1) {
            // Người dùng đã sử dụng mã này trước đó
            if (
              voucher.gioiHanLuotDung_MG &&
              voucher.daDung_MG[usedIndex].soLan >= voucher.gioiHanLuotDung_MG
            ) {
              throw new NotFoundException(
                `Mã giảm giá ${mg} đã đạt giới hạn sử dụng`
              );
            }
            // Tăng số lần sử dụng
            voucher.daDung_MG[usedIndex].soLan += 1;
            voucher.soLuong_MG -= 1;
          } else {
            // Người dùng chưa sử dụng mã, thêm mới
            voucher.daDung_MG.push({ idKhachHang: idKhachHang, soLan: 1 });
          }
        } else {
          if (usedIndex !== -1) {
            voucher.daDung_MG[usedIndex].soLan -= 1;
            voucher.daDung_MG = voucher.daDung_MG.filter(
              (user) => user.soLan > 0
            );
            voucher.soLuong_MG += 1;
          }
        }

        // Lưu cập nhật vào database
        const savedVoucher = await voucher.save();

        vouchers.push(savedVoucher);
      }
      return hoanLai ? { success: true } : { success: true, data: vouchers };
    } catch (error) {
      return { success: false, error: error };
    }
  }
}
