import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillPromotionService } from './billPromotion.service';
import { BillPromotionController } from './billPromotion.controller';
import { MA_GIAM, MA_GIAMSchema } from './billPromotion.schema';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MA_GIAM.name, schema: MA_GIAMSchema }]),
    RedisModule,
  ],
  controllers: [BillPromotionController],
  providers: [BillPromotionService],
  exports: [BillPromotionService],
})
export class BillPromotionModule {}
