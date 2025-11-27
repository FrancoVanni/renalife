import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { ProductsModule } from '../products/products.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ProductsModule, ConfigModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}

