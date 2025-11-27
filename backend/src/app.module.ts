import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { MessageModule } from './messages/message.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    ClientsModule,
    ProductsModule,
    SalesModule,
    MessageModule,
  ],
})
export class AppModule {}

