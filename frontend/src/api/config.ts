import axios from 'axios';

const API_BASE = '/api';

export interface Config {
  dollar_rate_official: number;
  usd_30_days: number;
}

export const configApi = {
  get: async (): Promise<Config> => {
    const response = await axios.get(`${API_BASE}/config`);
    return response.data;
  },

  update: async (config: Partial<Config>): Promise<Config> => {
    const response = await axios.patch(`${API_BASE}/config`, config);
    return response.data;
  },

  refreshDollarOfficial: async (): Promise<number> => {
    const response = await axios.get(`${API_BASE}/config/dollar-oficial`);
    return response.data.dollar_rate_official;
  },
};

