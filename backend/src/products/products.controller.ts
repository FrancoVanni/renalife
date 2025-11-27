import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CalcCarritoDto } from './dto/calc-carrito.dto';
import { ParsedProduct } from './products.parser';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  /**
   * POST /products/upload
   * Parsea el archivo Excel y devuelve preview sin guardar
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.productsService.uploadExcel(file);
  }

  /**
   * POST /products/confirm-upload
   * Confirma y guarda los productos parseados en la base de datos
   */
  @Post('confirm-upload')
  confirmUpload(@Body() body: { products: ParsedProduct[] }) {
    if (!body.products || !Array.isArray(body.products)) {
      throw new BadRequestException('products array is required');
    }
    return this.productsService.confirmUpload(body.products);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post('calc-carrito')
  calcForCarrito(@Body() calcCarritoDto: CalcCarritoDto) {
    if (!calcCarritoDto.products || !Array.isArray(calcCarritoDto.products)) {
      throw new BadRequestException('products array is required');
    }
    return this.productsService.calcForCarrito(calcCarritoDto);
  }
}

