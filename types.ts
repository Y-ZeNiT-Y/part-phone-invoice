export interface Client {
  id: string;
  name: string;
  phone?: string;
}

export interface InvoiceItem {
  id: string;
  code: string;
  unit: string;
  description: string;
  price: number;
  quantity: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  date: string;
  time: string;
  clientName: string;
  items: InvoiceItem[];
  total: number;
}

export const STORAGE_KEYS = {
  CLIENTS: 'pp_clients',
  HISTORY: 'pp_history',
};