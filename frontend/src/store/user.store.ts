import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/interfaces/user';

interface State {
  user: IUser | null;
  access_token: string | null;
  setUser: (user: any) => void;
  logout: () => void;
}

export const useUserStore = create<State>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, access_token: null }),
    }),
    {
      name: 'user-storage',
    },
  ),
);
