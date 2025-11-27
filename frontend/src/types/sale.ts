export interface Sale {
  id: number;
  client_id: number;
  product_id: number;
  units: number;
  price_usd_at_sale: number;
  dollar_rate_at_sale: number;
  price_final_ars: number;
  payment_condition: string;
  created_at: string;
}

