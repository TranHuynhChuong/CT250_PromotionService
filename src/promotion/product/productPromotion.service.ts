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
        await session.abortTransaction(); // Hủy bỏ transaction nếu tồn tại
        session.endSession();
        return {
          success: false,
          error: `Mã khuyến mãi ${khuyenMaiDto.ma_KM} đã tồn tại`,
        };
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
  ) {
    // Kiểm tra xem khuyến mãi có tồn tại không
    const khuyenMai = await this.khuyenMaiModel.findById(idKhuyenMai);
    if (!khuyenMai) {
      throw new NotFoundException('Khuyến mãi không tồn tại');
    }

    // Cập nhật thông tin khuyến mãi
    await this.khuyenMaiModel.findByIdAndUpdate(idKhuyenMai, khuyenMaiDto);

    // Xóa chi tiết khuyến mãi cũ trước khi thêm mới
    await this.chiTietKhuyenMaiModel.deleteMany({
      idKhuyenMai_KM: khuyenMai._id,
    });

    // Thêm danh sách chi tiết khuyến mãi mới
    if (chiTietKhuyenMaiDto.length > 0) {
      const chiTietList = chiTietKhuyenMaiDto.map((item) => ({
        idKhuyenMai_KM: khuyenMai._id,
        ...item,
      }));

      await this.chiTietKhuyenMaiModel.insertMany(chiTietList);
    }

    return { message: 'Cập nhật khuyến mãi thành công' };
  }

  async delete(idKhuyenMai: string) {
    // Kiểm tra xem khuyến mãi có tồn tại không
    const khuyenMai = await this.khuyenMaiModel.findById(idKhuyenMai);
    if (!khuyenMai) {
      throw new NotFoundException('Khuyến mãi không tồn tại');
    }

    // Xóa tất cả chi tiết khuyến mãi liên quan
    await this.chiTietKhuyenMaiModel.deleteMany({
      idKhuyenMai_KM: khuyenMai._id,
    });

    // Xóa khuyến mãi
    await this.khuyenMaiModel.findByIdAndDelete(khuyenMai._id);

    return { message: 'Xóa khuyến mãi thành công' };
  }

  // Lấy danh sách khuyến mãi
  async getAll(): Promise<any[]> {
    // Lấy danh sách khuyến mãi
    const khuyenMais = await this.khuyenMaiModel.find().exec();

    // Lấy chi tiết khuyến mãi cho từng khuyến mãi
    const result = await Promise.all(
      khuyenMais.map(async (khuyenMai) => {
        const chiTietKhuyenMai = await this.chiTietKhuyenMaiModel
          .find({ idKhuyenMai_KM: khuyenMai._id })
          .exec();

        return {
          ...khuyenMai.toObject(),
          chiTietKhuyenMai,
        };
      })
    );

    return result;
  }

  // Lấy thông tin khuyến mãi theo mã
  async find(id_KM: string): Promise<KHUYEN_MAI> {
    const khuyenMai = await this.khuyenMaiModel
      .findById(id_KM)
      .populate('idKhuyenMai_KM')
      .lean();

    if (!khuyenMai) {
      throw new NotFoundException('Khuyến mãi không tồn tại');
    }

    return khuyenMai;
  }

  async getUsablePromotionOfProduct(idSanPham: string): Promise<any> {
    const currentDate = new Date();

    const promotions = await this.chiTietKhuyenMaiModel
      .find({
        idSanPham_KM: idSanPham,
        soLuong_KM: { $gt: 0 }, // Chỉ lấy khuyến mãi còn số lượng
      })
      .populate({
        path: 'idKhuyenMai_KM', // Lấy thông tin khuyến mãi
        match: {
          ngayBatDau_KM: { $lte: currentDate }, // Đã bắt đầu
          ngayKetThuc_KM: { $gte: currentDate }, // Chưa kết thúc
        },
      })
      .lean()
      .exec();

    return promotions[0];
  }

  async getProductsOfUsablePromotion(): Promise<string[]> {
    const now = new Date();

    // Lấy tất cả chi tiết khuyến mãi và populate khuyến mãi tương ứng
    const khuyenMaiHieuLuc = await this.chiTietKhuyenMaiModel
      .find({})
      .populate('idKhuyenMai_KM');

    // Lọc ra những chi tiết khuyến mãi có hiệu lực
    const sanPhamDangKM = khuyenMaiHieuLuc
      .filter((ctkm) => {
        const km = ctkm.idKhuyenMai_KM as unknown as KHUYEN_MAI;
        return now >= km.ngayBatDau_KM && now <= km.ngayKetThuc_KM;
      })
      .map((ctkm) => ctkm.idSanPham_KM); // Chỉ lấy id sản phẩm

    return sanPhamDangKM;
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

    const danhSachIdTTBanHang = dsSP.map((sp) => sp.idTTBanHang_CTHD);

    // 🔍 Truy vấn tất cả các chương trình khuyến mãi 1 lần duy nhất
    const danhSachKhuyenMai = await this.chiTietKhuyenMaiModel.find({
      idSanPham_KM: { $in: danhSachIdTTBanHang },
    });

    if (danhSachKhuyenMai.length !== danhSachIdTTBanHang.length) {
      return {
        success: false,
        error: 'Có sản phẩm không có chương trình khuyến mãi hợp lệ',
      };
    }

    const newdsSP: {
      idSanPham_CTHD: string;
      idTTBanHang_CTHD: string;
      soLuong_CTHD: number;
      giaMua_CTHD: number;
    }[] = [];

    for (const sp of dsSP) {
      const promotion = danhSachKhuyenMai.find(
        (p) => p.idSanPham_KM.toString() === sp.idTTBanHang_CTHD
      );
      if (!promotion) {
        return {
          success: false,
          error: `Không tìm thấy khuyến mãi cho sản phẩm ${sp.idTTBanHang_CTHD}`,
        };
      }

      if (!hoanLai) {
        if (
          promotion.gioiHanDatHang_KM &&
          sp.soLuong_CTHD > promotion.gioiHanDatHang_KM
        ) {
          return {
            success: false,
            error: `Sản phẩm ${sp.idTTBanHang_CTHD} vượt giới hạn áp dụng`,
          };
        }
        if (
          promotion.soLuong_KM &&
          promotion.soLuong_KM <= 0 &&
          sp.soLuong_CTHD > promotion.soLuong_KM
        ) {
          return {
            success: false,
            error: `Sản phẩm ${sp.idTTBanHang_CTHD} không đủ để áp dụng giá giảm`,
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

    // 🔄 Thực hiện cập nhật số lượng sản phẩm trong khuyến mãi
    const bulkUpdate = dsSP.map((sp) => ({
      updateOne: {
        filter: { idSanPham_KM: sp.idTTBanHang_CTHD },
        update: {
          $inc: { soLuong_KM: hoanLai ? sp.soLuong_CTHD : -sp.soLuong_CTHD },
        },
      },
    }));

    await this.chiTietKhuyenMaiModel.bulkWrite(bulkUpdate);

    if (hoanLai) {
      return {
        success: true,
      };
    } else {
      return {
        success: true,
        data: newdsSP,
      };
    }
  }
}
