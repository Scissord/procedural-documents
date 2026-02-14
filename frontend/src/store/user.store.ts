import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/interfaces/auth/user';

interface State {
  user: IUser | null;
  setUser: (user: any) => void;
  updateUser: (data: Partial<IUser>) => void;
  logout: () => void;
}

export const useUserStore = create<State>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => set({ user }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      logout: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
    },
  ),
);
