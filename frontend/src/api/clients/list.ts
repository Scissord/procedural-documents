import { api } from '@/api';
import { IUser, IUserLogin } from '@/interfaces';

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
};

interface ClientsResult {
  clients: Client[] | [];
}

export const useClientsList = async (): Promise<ClientsResult> => {
  try {
    const response = await api.get('/clients');

    return {
      clients: response.data.user,
    };
  } catch (error: any) {
    return {
      clients: [],
    };
  }
};
