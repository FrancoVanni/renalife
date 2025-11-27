export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  price_usd: number;
  iva_included: boolean;
  description?: string;
  updated_at: string;
  provider?: string;
  origin?: string;
  price_alt_usd?: number;
  sheet?: string;
}

export interface ParsedProduct {
  code: string;
  name: string;
  provider: string;
  origin: string;
  price_usd: number | string;
  price_alt_usd: number | string;
  iva_included: boolean;
  category: string;
  sheet: string;
}

export interface ParseResult {
  preview: ParsedProduct[];
  totalParsed: number;
  warnings: string[];
  byCategories: { [category: string]: number };
}

export interface CartItem {
  id: number;
  code: string;
  name: string;
  price_usd: number;
  iva_included: boolean;
  quantity: number;
  payment_method: 'contado' | 'echeck' | '30_dias';
}

export interface CartItemCalculated {
  id: number;
  quantity: number;
  price_ars: number; // Precio final con IVA incluido
  price_base: number; // Precio sin IVA
  iva_amount: number;
  total_ars: number;
  payment_method: 'contado' | 'echeck' | '30_dias';
}

