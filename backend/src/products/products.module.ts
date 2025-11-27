import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { PriceCalculatorService } from './price-calculator.service';
import { DatabaseService } from '../database/database.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [ProductsController],
  providers: [DatabaseService, ProductsService, ProductsRepository, PriceCalculatorService],
  exports: [ProductsService, ProductsRepository, PriceCalculatorService],
})
export class ProductsModule {}

