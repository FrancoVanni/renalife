export class CreateProductDto {
  code: string;
  name: string;
  category: string;
  price_usd: number;
  iva_included: boolean;
  description?: string;
  provider?: string;
  origin?: string;
  price_alt_usd?: number;
  sheet?: string;
}

