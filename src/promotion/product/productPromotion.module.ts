import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  KHUYEN_MAI,
  KHUYEN_MAISchema,
  CHI_TIET_KHUYEN_MAI,
  CHI_TIET_KHUYEN_MAISchema,
} from './productPromotion.schema';
import { KhuyenMaiService } from './productPromotion.service';
import { KhuyenMaiController } from './productPromotion.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KHUYEN_MAI.name, schema: KHUYEN_MAISchema },
      { name: CHI_TIET_KHUYEN_MAI.name, schema: CHI_TIET_KHUYEN_MAISchema },
    ]),
  ],
  controllers: [KhuyenMaiController],
  providers: [KhuyenMaiService],
  exports: [KhuyenMaiService],
})
export class ProductPromotionModule {}
