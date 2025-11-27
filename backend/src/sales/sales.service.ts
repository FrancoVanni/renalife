import { Injectable } from '@nestjs/common';
import { SalesRepository } from './sales.repository';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './entities/sale.entity';

@Injectable()
export class SalesService {
  constructor(private readonly salesRepository: SalesRepository) {}

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    return this.salesRepository.create(createSaleDto);
  }

  async findByClient(clientId: number): Promise<Sale[]> {
    return this.salesRepository.findByClient(clientId);
  }

  async getTopClients(): Promise<any[]> {
    return this.salesRepository.getTopClients();
  }

  async getTopProducts(): Promise<any[]> {
    return this.salesRepository.getTopProducts();
  }
}

