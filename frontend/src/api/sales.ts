import axios from 'axios';
import { Sale } from '../types/sale';

const API_BASE = '/api';

export const salesApi = {
  create: async (sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> => {
    const response = await axios.post(`${API_BASE}/sales`, sale);
    return response.data;
  },

  getByClient: async (clientId: number): Promise<Sale[]> => {
    const response = await axios.get(`${API_BASE}/sales/by-client/${clientId}`);
    return response.data;
  },

  getTopClients: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE}/sales/analytics/top-clients`);
    return response.data;
  },

  getTopProducts: async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE}/sales/analytics/top-products`);
    return response.data;
  },
};

