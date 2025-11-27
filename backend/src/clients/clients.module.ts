import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { ClientsRepository } from './clients.repository';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [ClientsController],
  providers: [DatabaseService, ClientsService, ClientsRepository],
  exports: [ClientsService],
})
export class ClientsModule {}

