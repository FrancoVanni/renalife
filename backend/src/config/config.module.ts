import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { DollarService } from './dollar.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [ConfigController],
  providers: [ConfigService, DollarService],
  exports: [ConfigService, DollarService],
})
export class ConfigModule {}

