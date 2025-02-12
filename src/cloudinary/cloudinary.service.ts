/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import {
  UploadApiResponse,
  UploadApiErrorResponse,
  v2 as cloudinary,
} from 'cloudinary';
import * as toStream from 'buffer-to-stream';

@Injectable()
export class CloudinaryService {
  // Tải ảnh bìa sản phẩm
  async uploadImage(
    id: string,
    image: Express.Multer.File
  ): Promise<{ image_uploaded: { public_id: string; url: string } }> {
    return new Promise<{ public_id: string; url: string }>(
      (resolve, reject) => {
        const publicId = `${id}`;

        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: `Promotion/${id}`, public_id: publicId },
          (error, result) => {
            if (error) return reject(error);
            resolve({ public_id: result!.public_id, url: result!.url });
          }
        );

        toStream(image.buffer).pipe(uploadStream);
      }
    ).then((image_uploaded) => ({ image_uploaded }));
  }

  // Tải ảnh sản phẩm
  async uploadImages(
    id: string,
    images: Express.Multer.File[]
  ): Promise<{ image_uploaded: { public_id: string; url: string }[] }> {
    const uploadPromises_KM = images.map(
      (file) =>
        new Promise<UploadApiResponse | UploadApiErrorResponse>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: `Promotion/${id}` }, // Không đặt public_id để Cloudinary tự tạo
              (error, result) => {
                if (error) return reject(error);
                resolve(result!);
              }
            );
            toStream(file.buffer).pipe(uploadStream);
          }
        )
    );

    // Chờ tất cả ảnh tải lên và lọc ảnh thành công
    const Images_KM = await Promise.all(uploadPromises_KM);

    const image_uploaded = Images_KM.filter(
      (img): img is UploadApiResponse => 'public_id' in img && 'url' in img
    ).map((img) => ({ public_id: img.public_id, url: img.url }));

    return { image_uploaded };
  }

  async deleteFolder(folderPath: string): Promise<void> {
    try {
      // 1. Lấy dimage sách tất cả ảnh trong thư mục
      const { resources } = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath, // Lấy tất cả ảnh trong thư mục
      });

      if (resources.length > 0) {
        // 2. Xóa tất cả ảnh trong thư mục
        const publicIds = resources.map((file) => file.public_id);
        await cloudinary.api.delete_resources(publicIds);
      }

      // 3. Xóa thư mục (nếu không còn ảnh)
      await cloudinary.api.delete_folder(folderPath);
    } catch (error) {
      console.error(`Lỗi xóa thư mục ${folderPath}:`, error);
    }
  }

  async deleteImages(imagesPublicId: string[]): Promise<void> {
    if (!imagesPublicId || imagesPublicId.length === 0) return;

    try {
      await cloudinary.api.delete_resources(imagesPublicId);
    } catch (error) {
      console.error('Lỗi khi xóa ảnh trên Cloudinary:', error);
      throw new Error('Không thể xóa ảnh trên Cloudinary');
    }
  }

  async updateImage(
    publicId: string,
    newImage: Express.Multer.File
  ): Promise<{ public_id: string; url: string }> {
    return new Promise<{ public_id: string; url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { public_id: publicId, overwrite: true },
          (error, result) => {
            if (error) return reject(error);
            resolve({ public_id: result!.public_id, url: result!.url });
          }
        );

        toStream(newImage.buffer).pipe(uploadStream);
      }
    ).then((result) => result);
  }

  async updateImages(
    publicIds: string[],
    newImages: Express.Multer.File[]
  ): Promise<{ public_id: string; url: string }[]> {
    if (publicIds.length !== newImages.length) {
      throw new Error('Số lượng publicId và số lượng ảnh không khớp!');
    }

    const uploadPromises = publicIds.map((publicId, index) => {
      return new Promise<{ public_id: string; url: string }>(
        (resolve, reject) => {
          console.log('publicId', publicId);
          const uploadStream = cloudinary.uploader.upload_stream(
            { public_id: publicId, overwrite: true }, // Giữ nguyên publicId cũ
            (error, result) => {
              if (error) return reject(error);
              resolve({
                public_id: result!.public_id,
                url: result!.secure_url,
              });
            }
          );
          toStream(newImages[index].buffer).pipe(uploadStream);
        }
      );
    });

    return await Promise.all(uploadPromises);
  }
}
