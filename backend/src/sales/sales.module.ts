import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SalesRepository } from './sales.repository';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [SalesController],
  providers: [DatabaseService, SalesService, SalesRepository],
  exports: [SalesService],
})
export class SalesModule {}

