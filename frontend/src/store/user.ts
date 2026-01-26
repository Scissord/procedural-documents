import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/interfaces/user';

interface State {
  user: IUser | null;
  access_token: string | null;
  setUser: (user: IUser) => void;
  setAccessToken: (access_token: string) => void;
  logout: () => void;
}

export const useUserStore = create<State>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      setUser: (user) => {
        const parsed_user = JSON.stringify(user);
        localStorage.setItem('user', parsed_user);
        set({ user });
      },
      setAccessToken: (access_token) => {
        localStorage.setItem('access_token', access_token);
        set({ access_token });
      },
      logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        set({ user: null, access_token: null });
      },
    }),
    {
      name: 'user',
    },
  ),
);
