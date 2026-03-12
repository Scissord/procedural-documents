import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/interfaces/auth/user';

interface State {
  user: IUser | null;
  isSessionChecked: boolean;
  setUser: (user: any) => void;
  setSessionChecked: (checked: boolean) => void;
  updateUser: (data: Partial<IUser>) => void;
  logout: () => void;
}

export const useUserStore = create<State>()(
  persist(
    (set) => ({
      user: null,
      isSessionChecked: false,

      setUser: (user) => set({ user, isSessionChecked: true }),

      setSessionChecked: (checked) => set({ isSessionChecked: checked }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      logout: () => set({ user: null, isSessionChecked: true }),
    }),
    {
      name: 'user-storage',
    },
  ),
);
