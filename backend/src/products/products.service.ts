import { Injectable, BadRequestException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { CalcCarritoDto } from './dto/calc-carrito.dto';
import { Product } from './entities/product.entity';
import { ProductsParser, ParseResult, ParsedProduct } from './products.parser';
import { PriceCalculatorService } from './price-calculator.service';
import { generateProductsHash } from './utils/hash.util';

@Injectable()
export class ProductsService {
  private parser: ProductsParser;

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly priceCalculator: PriceCalculatorService,
  ) {
    this.parser = new ProductsParser();
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.findAll();
  }

  async findOne(id: number): Promise<Product | null> {
    return this.productsRepository.findOne(id);
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    return this.productsRepository.create(createProductDto);
  }

  /**
   * Parsea el archivo Excel y devuelve un preview sin guardar en la base de datos
   */
  async uploadExcel(file: Express.Multer.File): Promise<ParseResult> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Archivo vacío o inválido');
    }

    try {
      console.log("📄 Archivo recibido:", {
        name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      const result = this.parser.parseWorkbook(file.buffer);

      console.log("✅ Parse OK:", {
        parsed: result.totalParsed,
        warnings: result.warnings?.length ?? 0,
      });

      return result;

    } catch (err) {
      console.error("❌ ERROR PARSEANDO XLSX:", err);
      throw new BadRequestException('Archivo Excel inválido o no compatible');
    }
  }

  /**
   * Confirma y guarda los productos parseados en la base de datos
   * La tabla products queda idéntica al archivo Excel
   */
  async confirmUpload(products: ParsedProduct[]): Promise<Product[]> {
    // Iniciar transacción
    await this.productsRepository.beginTransaction();

    try {
      // 1. Eliminar todos los productos existentes
      await this.productsRepository.deleteAll();

      // 2. Insertar todos los productos parseados
      const savedProducts: Product[] = [];
      const errors: string[] = [];

      for (const parsedProduct of products) {
        try {
          const createDto: CreateProductDto = {
            code: parsedProduct.code,
            name: parsedProduct.name,
            category: parsedProduct.category,
            price_usd: parsedProduct.price_usd,
            iva_included: parsedProduct.iva_included,
            description: parsedProduct.name, // Usar name como description
            provider: parsedProduct.provider,
            origin: parsedProduct.origin,
            price_alt_usd: parsedProduct.price_alt_usd,
            sheet: parsedProduct.sheet,
          };

          const product = await this.productsRepository.create(createDto);
          savedProducts.push(product);
        } catch (error: any) {
          errors.push(`Error guardando producto "${parsedProduct.code}": ${error.message}`);
        }
      }

      if (errors.length > 0) {
        console.warn('Errores al guardar algunos productos:', errors);
      }

      // 3. Verificación con hash
      const dbProducts = await this.productsRepository.findAllOrderedByCode();
      
      // Generar hash de productos parseados
      const excelHash = generateProductsHash(products);
      
      // Generar hash de productos en DB
      const dbHash = generateProductsHash(dbProducts.map(p => ({
        code: p.code,
        name: p.name,
        provider: p.provider,
        origin: p.origin,
        category: p.category,
        price_usd: p.price_usd,
        price_alt_usd: p.price_alt_usd,
        sheet: p.sheet,
      })));

      // Comparar hashes
      if (excelHash === dbHash) {
        console.log('🟢 Upload verification OK: Excel hash matches DB hash');
      } else {
        console.warn(`🔴 WARNING: Excel/DB mismatch. Excel count ${products.length}, DB count ${dbProducts.length}`);
        console.warn(`Excel hash: ${excelHash}`);
        console.warn(`DB hash: ${dbHash}`);
      }

      // Commit de la transacción
      await this.productsRepository.commit();

      return savedProducts;
    } catch (error: any) {
      // Rollback en caso de error
      await this.productsRepository.rollback();
      throw error;
    }
  }

  async calcForCarrito(calcCarritoDto: CalcCarritoDto): Promise<Array<{ id: number; quantity: number; price_ars: number; price_base: number; iva_amount: number; total_ars: number; payment_method: 'contado' | 'echeck' | '30_dias' }>> {
    const products = await Promise.all(
      calcCarritoDto.products.map(item => this.productsRepository.findOne(item.id))
    );

    const items = products.map((product, index) => {
      if (!product) {
        throw new BadRequestException(`Product ${calcCarritoDto.products[index].id} not found`);
      }
      return {
        product,
        quantity: calcCarritoDto.products[index].quantity,
        payment_method: calcCarritoDto.products[index].payment_method || 'contado' as 'contado' | 'echeck' | '30_dias',
      };
    });

    return this.priceCalculator.calculateCartPrices(items);
  }
}

