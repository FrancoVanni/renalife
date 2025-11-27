import axios from 'axios';

const API_BASE = '/api';

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

export const messagesApi = {
  generate: async (input: MessageGenerationInput): Promise<GeneratedMessages> => {
    const response = await axios.post(`${API_BASE}/messages/generate`, input);
    return response.data;
  },
};

