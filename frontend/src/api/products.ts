import axios from 'axios';
import { Product, ParseResult, ParsedProduct } from '../types/product';

const API_BASE = '/api';

export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const response = await axios.get(`${API_BASE}/products`);
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await axios.get(`${API_BASE}/products/${id}`);
    return response.data;
  },

  uploadExcel: async (file: File): Promise<ParseResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE}/products/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  confirmUpload: async (products: ParsedProduct[]): Promise<Product[]> => {
    const response = await axios.post(`${API_BASE}/products/confirm-upload`, {
      products,
    });
    return response.data;
  },

  calcForCarrito: async (products: Array<{ id: number; quantity: number; payment_method: 'contado' | 'echeck' | '30_dias' }>): Promise<Array<{ id: number; quantity: number; price_ars: number; price_base: number; iva_amount: number; total_ars: number; payment_method: 'contado' | 'echeck' | '30_dias' }>> => {
    const response = await axios.post(`${API_BASE}/products/calc-carrito`, {
      products,
    });
    return response.data;
  },
};

