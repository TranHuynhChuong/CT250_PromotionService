import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MA_GIAM } from './billPromotion.schema';
import { MaGiamDTO } from './billPromotion.dto';

@Injectable()
export class BillPromotionService {
  constructor(
    @InjectModel(MA_GIAM.name) private readonly maGiamModel: Model<MA_GIAM>
  ) {}

  async findAll(): Promise<MA_GIAM[]> {
    return this.maGiamModel.find().exec();
  }

  async findOne(id: string): Promise<MA_GIAM> {
    const maGiam = await this.maGiamModel.findById(id).exec();
    if (!maGiam) {
      throw new NotFoundException('Mã giảm giá không tồn tại');
    }
    return maGiam;
  }

  async create(dto: MaGiamDTO): Promise<MA_GIAM> {
    const maGiam = await this.maGiamModel.findOne({ ma_MG: dto.ma_MG }).exec();
    if (maGiam) {
      throw new Error('Mã giảm giá đã tồn tại');
    }
    const newMaGiam = new this.maGiamModel(dto);
    return newMaGiam.save();
  }

  async update(id: string, dto: Partial<MaGiamDTO>): Promise<MA_GIAM> {
    const updatedMaGiam = await this.maGiamModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updatedMaGiam) {
      throw new NotFoundException('Mã giảm giá không tồn tại');
    }
    return updatedMaGiam;
  }

  async delete(id: string): Promise<void> {
    const result = await this.maGiamModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Mã giảm giá không tồn tại');
    }
  }

  async findUsable(idKhachHang: string): Promise<MA_GIAM[]> {
    const now = new Date();

    const dsMaGiam = await this.maGiamModel.find({
      ngayBatDau_MG: { $lte: now },
      ngayKetThuc_MG: { $gte: now },
    });

    // Lọc ra mã mà khách hàng chưa dùng hết giới hạn
    const maGiamCoTheDung = dsMaGiam.filter((maGiam) => {
      const daDung = maGiam.daDung_MG.find(
        (mg) => mg.idKhachHang === idKhachHang
      );
      return !daDung || daDung.soLan < maGiam.gioiHanLuotDung_MG;
    });

    return maGiamCoTheDung;
  }

  async usingVoucher(
    idKhachHang: string,
    dsVoucher: string[],
    hoanLai: boolean = false
  ): Promise<{ success: boolean; data?: MA_GIAM[]; error?: string }> {
    console.log(idKhachHang, dsVoucher, hoanLai);
    const now = new Date();
    const vouchers: MA_GIAM[] = [];
    for (const mg of dsVoucher) {
      const voucher = await this.maGiamModel.findById(mg);
      if (!voucher) {
        return {
          success: false,
          error: `Mã giảm giá ${mg} không tồn tại`,
        };
      }

      // Kiểm tra mã có còn hiệu lực không
      if (voucher.ngayBatDau_MG > now || voucher.ngayKetThuc_MG < now) {
        return {
          success: false,
          error: `Mã giảm giá ${mg} không còn hiệu lực`,
        };
      }

      // Kiểm tra mã giảm còn lượt sử dụng không
      if (voucher.soLuong_MG && voucher.soLuong_MG <= 0) {
        return {
          success: false,
          error: `Mã giảm giá ${mg} đã hết lượt sử dụng`,
        };
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
            return {
              success: false,
              error: `Mã giảm giá ${mg} đã đạt giới hạn sử dụng`,
            };
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
      console.log(savedVoucher);
      vouchers.push(savedVoucher);
    }
    if (hoanLai) {
      return {
        success: true,
      };
    } else {
      return {
        success: true,
        data: vouchers,
      };
    }
  }
}
