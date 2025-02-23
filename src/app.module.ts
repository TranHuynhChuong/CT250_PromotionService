import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BillPromotionModule } from './promotion/bill/billPromotion.module';
import { ProductPromotionModule } from './promotion/product/productPromotion.module';
import { RedisModule } from './redis/redis.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        if (!uri) {
          throw new Error('MongoDB URI không được cung cấp!');
        }
        return { uri };
      },
    }),
    BillPromotionModule,
    ProductPromotionModule,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
