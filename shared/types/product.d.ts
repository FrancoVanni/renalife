export interface Product {
    id: number;
    code: string;
    name: string;
    category: string;
    price_usd: number;
    iva_included: boolean;
    description?: string;
    updated_at: Date;
}
