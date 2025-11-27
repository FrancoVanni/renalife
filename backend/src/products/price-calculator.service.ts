import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { ConfigService } from '../config/config.service';

export interface PriceCalculationResult {
  price_base: number; // Precio sin IVA
  iva_amount: number;
  price_ars: number; // Precio final con IVA incluido
}

@Injectable()
export class PriceCalculatorService {
  private readonly IVA_RATE = 0.21; // 21%

  constructor(private configService: ConfigService) {}

  /**
   * Calcula el precio de un producto según el método de pago
   * 
   * Reglas:
   * - Contado: Dólar oficial + IVA
   * - E-check: Dólar oficial + IVA
   * - 30 días: Dólar 30 días + IVA
   * 
   * Sin recargos adicionales
   */
  async calculatePrice(
    product: Product,
    paymentMethod: 'contado' | 'echeck' | '30_dias',
  ): Promise<PriceCalculationResult> {
    const config = await this.configService.getConfig();
    
    // Determinar qué dólar usar
    const dollarRate = paymentMethod === '30_dias' 
      ? config.usd_30_days 
      : config.dollar_rate_official;

    // Precio base en ARS (sin IVA)
    const price_base = product.price_usd * dollarRate;

    // Calcular IVA
    let iva_amount = 0;
    let price_ars = price_base;
    let price_base_final = price_base;

    if (product.iva_included) {
      // Si IVA está incluido en el precio USD, el precio_base ya incluye IVA
      // Necesitamos extraer el IVA del precio total
      // precio_con_iva = precio_sin_iva * (1 + 0.21)
      // precio_sin_iva = precio_con_iva / (1 + 0.21)
      price_base_final = price_base / (1 + this.IVA_RATE);
      iva_amount = price_base - price_base_final;
      price_ars = price_base; // Ya incluye IVA
    } else {
      // Si no está incluido, agregarlo
      iva_amount = price_base * this.IVA_RATE;
      price_ars = price_base + iva_amount;
      price_base_final = price_base;
    }

    return {
      price_base: price_base_final,
      iva_amount,
      price_ars,
    };
  }

  /**
   * Calcula precios para múltiples items del carrito
   */
  async calculateCartPrices(
    items: Array<{
      product: Product;
      quantity: number;
      payment_method: 'contado' | 'echeck' | '30_dias';
    }>,
  ): Promise<Array<{
      id: number;
      quantity: number;
      price_base: number;
      iva_amount: number;
      price_ars: number;
      total_ars: number;
      payment_method: 'contado' | 'echeck' | '30_dias';
    }>> {
    const results = [];

    for (const item of items) {
      const calculation = await this.calculatePrice(item.product, item.payment_method);
      
      results.push({
        id: item.product.id,
        quantity: item.quantity,
        price_base: calculation.price_base,
        iva_amount: calculation.iva_amount,
        price_ars: calculation.price_ars,
        total_ars: calculation.price_ars * item.quantity,
        payment_method: item.payment_method,
      });
    }

    return results;
  }
}

