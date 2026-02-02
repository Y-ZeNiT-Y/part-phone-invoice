import { Client, STORAGE_KEYS } from '../types';

export const getClients = (): Client[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
  return data ? JSON.parse(data) : [];
};

export const saveClient = (client: Client) => {
  const clients = getClients();
  const exists = clients.find(c => c.name.toLowerCase() === client.name.toLowerCase());
  if (!exists) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([...clients, client]));
  }
};