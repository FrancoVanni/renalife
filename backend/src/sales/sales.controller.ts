import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get('by-client/:id')
  findByClient(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findByClient(id);
  }

  @Get('analytics/top-clients')
  getTopClients() {
    return this.salesService.getTopClients();
  }

  @Get('analytics/top-products')
  getTopProducts() {
    return this.salesService.getTopProducts();
  }
}

