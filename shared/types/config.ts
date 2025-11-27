export interface Config {
  dollar_rate_official: number; // Dólar oficial (solo lectura, desde API)
  usd_30_days: number; // Dólar a 30 días (editable)
}

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
  clientMessage: string; // Mensaje para WhatsApp al cliente
  companyMessage: string; // Mensaje para orden de compra
}

