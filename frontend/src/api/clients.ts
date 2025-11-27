import axios from 'axios';
import { Client } from '../types/client';

const API_BASE = '/api';

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await axios.get(`${API_BASE}/clients`);
    return response.data;
  },

  create: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
    const response = await axios.post(`${API_BASE}/clients`, client);
    return response.data;
  },

  update: async (id: number, client: Partial<Client>): Promise<Client> => {
    const response = await axios.put(`${API_BASE}/clients/${id}`, client);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/clients/${id}`);
  },

  import: async (file: File): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE}/clients/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

