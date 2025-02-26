import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KHUYEN_MAI, CHI_TIET_KHUYEN_MAI } from './productPromotion.schema';
import {
  CreateKhuyenMaiDto,
  UpdateKhuyenMaiDto,
  CreateChiTietKhuyenMaiDto,
  UpdateChiTietKhuyenMaiDto,
} from './productPromotion.dto';

@Injectable()
export class KhuyenMaiService {
  constructor(
    @InjectModel(KHUYEN_MAI.name) private khuyenMaiModel: Model<KHUYEN_MAI>,
    @InjectModel(CHI_TIET_KHUYEN_MAI.name)
    private chiTietKhuyenMaiModel: Model<CHI_TIET_KHUYEN_MAI>
  ) {}

  async create(
    khuyenMaiDto: CreateKhuyenMaiDto,
    chiTietKhuyenMaiDto: CreateChiTietKhuyenMaiDto[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const session = await this.khuyenMaiModel.startSession();
    session.startTransaction(); // Bắt đầu transaction

    try {
      // Kiểm tra xem mã khuyến mãi đã tồn tại chưa
      const existingKM = await this.khuyenMaiModel.findOne(
        { ma_KM: khuyenMaiDto.ma_KM },
        null,
        { session }
      );

      if (existingKM) {
        throw new NotFoundException('Khuyến mãi đã tồn tại');
      }

      // Tạo khuyến mãi mới
      const khuyenMai = await this.khuyenMaiModel.create([khuyenMaiDto], {
        session,
      });

      // Nếu có chi tiết khuyến mãi, thêm vào
      let chiTietKhuyenMais;
      if (chiTietKhuyenMaiDto.length > 0) {
        const chiTietList = chiTietKhuyenMaiDto.map((item) => ({
          idKhuyenMai_KM: khuyenMai[0]._id, // Vì `create()` trả về mảng khi dùng `session`
          ...item,
        }));

        chiTietKhuyenMais = await this.chiTietKhuyenMaiModel.insertMany(
          chiTietList,
          { session }
        );
      }

      await session.commitTransaction(); // Xác nhận transaction
      session.endSession();

      return {
        success: true,
        data: { khuyenMai: khuyenMai[0], chiTietKhuyenMais },
      };
    } catch (error) {
      await session.abortTransaction(); // Hủy bỏ transaction nếu có lỗi
      session.endSession();
      return {
        success: false,
        error: `Lỗi khi tạo khuyến mãi: ${error.message}`,
      };
    }
  }

  async update(
    idKhuyenMai: string,
    khuyenMaiDto: UpdateKhuyenMaiDto,
    chiTietKhuyenMaiDto: UpdateChiTietKhuyenMaiDto[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const session = await this.khuyenMaiModel.db.startSession();
    session.startTransaction();

    try {
      // Cập nhật thông tin khuyến mãi và lấy bản ghi mới
      const khuyenMai = await this.khuyenMaiModel.findByIdAndUpdate(
        idKhuyenMai,
        khuyenMaiDto,
        { new: true, session }
      );

      if (!khuyenMai) {
        throw new NotFoundException('Khuyến mãi không tồn tại');
      }

      // Xóa các chi tiết khuyến mãi cũ
      await this.chiTietKhuyenMaiModel.deleteMany(
        { idKhuyenMai_KM: idKhuyenMai },
        { session }
      );

      // Chèn danh sách chi tiết khuyến mãi mới
      if (chiTietKhuyenMaiDto.length > 0) {
        const chiTietList = chiTietKhuyenMaiDto.map((item) => ({
          idKhuyenMai_KM: khuyenMai._id,
          ...item,
        }));

        await this.chiTietKhuyenMaiModel.insertMany(chiTietList, { session });
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        data: khuyenMai,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async delete(
    idKhuyenMai: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const session = await this.khuyenMaiModel.db.startSession();
    session.startTransaction();

    try {
      // Xóa chi tiết khuyến mãi liên quan trước
      await this.chiTietKhuyenMaiModel.deleteMany(
        { idKhuyenMai_KM: idKhuyenMai },
        { session }
      );

      // Xóa khuyến mãi
      const deletedKhuyenMai = await this.khuyenMaiModel.findByIdAndDelete(
        idKhuyenMai,
        { session }
      );

      if (!deletedKhuyenMai) {
        throw new NotFoundException('Khuyến mãi không tồn tại');
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        data: deletedKhuyenMai,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAllActive(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const khuyenMais = await this.khuyenMaiModel.aggregate([
        {
          $lookup: {
            from: 'CHI_TIET_KHUYEN_MAI',
            localField: '_id',
            foreignField: 'idKhuyenMai_KM',
            as: 'chiTietKhuyenMai',
          },
        },
      ]);

      return {
        success: true,
        data: khuyenMais,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAll(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const currentDate = new Date();

      const khuyenMais = await this.khuyenMaiModel.aggregate([
        {
          $match: {
            ngayBatDau_KM: { $lte: currentDate }, // Đã bắt đầu
            ngayKetThuc_KM: { $gte: currentDate }, // Chưa kết thúc
          },
        },
        {
          $lookup: {
            from: 'CHI_TIET_KHUYEN_MAI',
            localField: '_id',
            foreignField: 'idKhuyenMai_KM',
            as: 'chiTietKhuyenMai',
          },
        },
      ]);

      return {
        success: true,
        data: khuyenMais,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async findOne(
    id_KM: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Tìm khuyến mãi
      const khuyenMai = await this.khuyenMaiModel.findById(id_KM).lean();

      if (!khuyenMai) {
        return {
          success: false,
          error: 'Khuyến mãi không tồn tại',
        };
      }

      // Tìm tất cả chi tiết khuyến mãi có id_KM tham chiếu đến khuyến mãi
      const chiTietKhuyenMai = await this.chiTietKhuyenMaiModel
        .find({ idKhuyenMai_KM: id_KM }) // Lọc theo id_KM
        .lean();

      return {
        success: true,
        data: {
          ...khuyenMai,
          chiTietKhuyenMai, // Gắn danh sách chi tiết vào kết quả
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getActiveByProductId(
    idSanPham: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const currentDate = new Date();

      // Truy vấn danh sách chi tiết khuyến mãi có thể sử dụng
      const promotions = await this.chiTietKhuyenMaiModel
        .find({
          idSanPham_KM: idSanPham,
          soLuong_KM: { $gt: 0 }, // Chỉ lấy khuyến mãi còn số lượng
        })
        .populate({
          path: 'idKhuyenMai_KM', // Tham chiếu tới KhuyenMai
          match: {
            ngayBatDau_KM: { $lte: currentDate }, // Đã bắt đầu
            ngayKetThuc_KM: { $gte: currentDate }, // Chưa kết thúc
          },
        })
        .lean()
        .exec();

      // Loại bỏ các khuyến mãi không hợp lệ (idKhuyenMai_KM bị null)
      const validPromotions = promotions.filter((p) => p.idKhuyenMai_KM);

      return {
        success: true,
        data: validPromotions, // Trả về danh sách khuyến mãi hợp lệ
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getActiveByProductIds(
    idSanPhams: string[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const currentDate = new Date();

      // Truy vấn danh sách chi tiết khuyến mãi có thể sử dụng cho danh sách sản phẩm
      const promotions = await this.chiTietKhuyenMaiModel
        .find({
          idSanPham_KM: { $in: idSanPhams }, // Lọc theo danh sách sản phẩm
          soLuong_KM: { $gt: 0 }, // Chỉ lấy khuyến mãi còn số lượng
        })
        .populate({
          path: 'idKhuyenMai_KM', // Tham chiếu tới KhuyenMai
          match: {
            ngayBatDau_KM: { $lte: currentDate }, // Đã bắt đầu
            ngayKetThuc_KM: { $gte: currentDate }, // Chưa kết thúc
          },
        })
        .lean()
        .exec();

      // Loại bỏ các khuyến mãi không hợp lệ (idKhuyenMai_KM bị null)
      const validPromotions = promotions.filter((p) => p.idKhuyenMai_KM);

      return {
        success: true,
        data: validPromotions, // Trả về danh sách khuyến mãi hợp lệ
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getProducts(
    idKhuyenMai: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const chiTietKhuyenMai = await this.chiTietKhuyenMaiModel
      .find({ idKhuyenMai_KM: idKhuyenMai })
      .select('idSanPham_KM')
      .lean();

    return {
      success: true,
      data: chiTietKhuyenMai.map((item) => item.idSanPham_KM),
    };
  }

  async capNhatSoLuongSanPhamKhuyenMai(
    dsSP: {
      idSanPham_CTHD: string;
      idTTBanHang_CTHD: string;
      soLuong_CTHD: number;
      giaMua_CTHD: number;
    }[],
    hoanLai: boolean = false
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (dsSP.length === 0) {
      return { success: false, error: 'Danh sách sản phẩm rỗng' };
    }

    const danhSachIdSanPham = dsSP.map((sp) => sp.idSanPham_CTHD);

    // 🔍 Lấy danh sách khuyến mãi hợp lệ cho các sản phẩm
    const danhSachKhuyenMai =
      await this.getActiveByProductIds(danhSachIdSanPham);

    if (!danhSachKhuyenMai.success) {
      return { success: false, error: danhSachKhuyenMai.error };
    }

    const promotions = danhSachKhuyenMai.data;

    const newdsSP: {
      idSanPham_CTHD: string;
      idTTBanHang_CTHD: string;
      soLuong_CTHD: number;
      giaMua_CTHD: number;
    }[] = [];

    for (const sp of dsSP) {
      const promotion = promotions.find(
        (p) => p.idSanPham_KM.toString() === sp.idSanPham_CTHD
      );

      if (!promotion) {
        return {
          success: false,
          error: `Không tìm thấy khuyến mãi hợp lệ cho sản phẩm ${sp.idSanPham_CTHD}`,
        };
      }

      if (!hoanLai) {
        if (
          promotion.gioiHanDatHang_KM &&
          sp.soLuong_CTHD > promotion.gioiHanDatHang_KM
        ) {
          return {
            success: false,
            error: `Sản phẩm ${sp.idSanPham_CTHD} vượt giới hạn đặt hàng`,
          };
        }

        if (
          promotion.soLuong_KM <= 0 ||
          sp.soLuong_CTHD > promotion.soLuong_KM
        ) {
          return {
            success: false,
            error: `Sản phẩm ${sp.idSanPham_CTHD} không đủ số lượng khuyến mãi`,
          };
        }

        // 🔍 Tính giá bán mới
        let giaMuaMoi = sp.giaMua_CTHD;
        if (promotion.tyLeGiam_KM) {
          giaMuaMoi = sp.giaMua_CTHD * (1 - promotion.tyLeGiam_KM / 100);
        }
        if (promotion.mucGiam_KM) {
          giaMuaMoi = Math.max(giaMuaMoi - promotion.mucGiam_KM, 0); // Chặn giá âm
        }

        newdsSP.push({
          idSanPham_CTHD: sp.idSanPham_CTHD,
          idTTBanHang_CTHD: sp.idTTBanHang_CTHD,
          soLuong_CTHD: sp.soLuong_CTHD,
          giaMua_CTHD: giaMuaMoi,
        });
      }
    }

    // 🔄 Cập nhật số lượng sản phẩm trong khuyến mãi
    const bulkUpdate = dsSP.map((sp) => ({
      updateOne: {
        filter: { idSanPham_KM: sp.idSanPham_CTHD },
        update: {
          $inc: { soLuong_KM: hoanLai ? sp.soLuong_CTHD : -sp.soLuong_CTHD },
        },
      },
    }));

    await this.chiTietKhuyenMaiModel.bulkWrite(bulkUpdate);

    return hoanLai ? { success: true } : { success: true, data: newdsSP };
  }
}
