import { Injectable, Logger } from '@nestjs/common';
import { ProductsRepository } from '../products/products.repository';
import { PriceCalculatorService } from '../products/price-calculator.service';
import { DollarService } from '../config/dollar.service';

export interface MessageGenerationInput {
  items: Array<{
    id: number;
    code: string;
    name: string;
    quantity: number;
    price_usd: number;
    iva_included: boolean;
  }>;
  payment_method: 'contado' | 'echeck' | '30_dias';
  client_name?: string;
  delivery_info?: string;
}

export interface GeneratedMessages {
  clientMessage: string;
  companyMessage: string;
}

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private productsRepository: ProductsRepository,
    private priceCalculator: PriceCalculatorService,
    private dollarService: DollarService,
  ) {}

  /**
   * Genera mensajes para cliente (WhatsApp) y empresa (orden de compra)
   * Asegura que el dólar esté fresco antes de generar los mensajes
   */
  async generateMessages(input: MessageGenerationInput): Promise<GeneratedMessages> {
    // Asegurar que el dólar esté fresco antes de generar mensajes
    // Si el cache tiene más de 5 minutos, lo refrescamos
    if (!this.dollarService.isCacheFresh()) {
      this.logger.log('Dollar cache not fresh, refreshing before generating messages');
      await this.dollarService.getOfficialRateFresh();
    }

    // Obtener productos completos
    const products = await Promise.all(
      input.items.map(item => this.productsRepository.findOne(item.id))
    );

    // Calcular precios para cada item
    const calculations = await Promise.all(
      products.map((product, index) => {
        if (!product) {
          throw new Error(`Product ${input.items[index].id} not found`);
        }
        return this.priceCalculator.calculatePrice(product, input.payment_method);
      })
    );

    // Generar mensaje para cliente
    const clientMessage = this.generateClientMessage(input, calculations);

    // Generar mensaje para empresa
    const companyMessage = this.generateCompanyMessage(input, calculations);

    return {
      clientMessage,
      companyMessage,
    };
  }

  private generateClientMessage(
    input: MessageGenerationInput,
    calculations: Array<{ price_base: number; iva_amount: number; price_ars: number }>,
  ): string {
    const greeting = input.client_name 
      ? `Hola ${input.client_name},` 
      : 'Hola,';
    
    let message = `${greeting}\n\n`;
    message += `Te paso la cotización:\n\n`;

    let totalGeneral = 0;

    input.items.forEach((item, index) => {
      const calc = calculations[index];
      const subtotal = calc.price_ars * item.quantity;
      totalGeneral += subtotal;

      message += `${item.quantity}) ${item.quantity} x ${item.name}\n`;
      message += `Unix: ${item.code}\n`;
      message += `Precio unitario: $${calc.price_ars.toFixed(2)}\n`;
      message += `Total: $${subtotal.toFixed(2)}\n\n`;
    });

    message += `Total general: $${totalGeneral.toFixed(2)}\n\n`;

    const conditionText = this.getPaymentConditionText(input.payment_method);
    message += `Condición de pago: ${conditionText}`;

    return message;
  }

  private generateCompanyMessage(
    input: MessageGenerationInput,
    calculations: Array<{ price_base: number; iva_amount: number; price_ars: number }>,
  ): string {
    const date = new Date().toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let message = `${date}\n\n`;
    message += `Orden de compra:\n\n`;

    let totalGeneral = 0;
    let totalIva = 0;

    input.items.forEach((item, index) => {
      const calc = calculations[index];
      const subtotalSinIva = calc.price_base * item.quantity;
      const subtotalIva = calc.iva_amount * item.quantity;
      const subtotalConIva = calc.price_ars * item.quantity;
      
      totalGeneral += subtotalConIva;
      totalIva += subtotalIva;

      message += `${item.quantity}) ${item.quantity} x ${item.name}\n`;
      message += `Unix: ${item.code}\n`;
      message += `Precio unitario: $${calc.price_base.toFixed(2)} + IVA\n`;
      message += `Total: $${subtotalSinIva.toFixed(2)} + IVA ($${subtotalIva.toFixed(2)}) = $${subtotalConIva.toFixed(2)}\n\n`;
    });

    message += `Total general: $${totalGeneral.toFixed(2)}\n\n`;

    const conditionText = this.getPaymentConditionText(input.payment_method);
    message += `Forma de pago: ${conditionText}\n`;

    if (input.delivery_info) {
      message += `Lugar de entrega: ${input.delivery_info}\n`;
    }

    message += `\nAdjunto OC.`;

    return message;
  }

  private getPaymentConditionText(method: 'contado' | 'echeck' | '30_dias'): string {
    switch (method) {
      case 'contado':
        return 'Contado';
      case 'echeck':
        return 'E-check';
      case '30_dias':
        return '30 días';
    }
  }
}

