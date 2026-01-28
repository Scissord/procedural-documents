import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/interfaces/user';

interface State {
  user: IUser | null;
  access_token: string | null;
  setUser: (user: any) => void;
  setAccessToken: (access_token: any) => void;
  logout: () => void;
  updateUser: (user: IUser) => void;
}

export const useUserStore = create<State>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      setUser: (user) => set({ user }),
      setAccessToken: (access_token) => set({ access_token }),
      logout: () => set({ user: null, access_token: null }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage',
    },
  ),
);
