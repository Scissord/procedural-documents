import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/interfaces/user';
import { AuthService } from '@/services';

interface State {
  user: IUser | null;
  setUser: (user: IUser, accessToken: string) => void;
  logout: () => void;
  getProfile: () => Promise<void>;
  updateUser: (user: IUser) => void;
}

export const useUserStore = create<State>()(
  persist(
    (set) => ({
      user: null,
      getProfile: async () => {
        try {
          const user = await AuthService.getProfile();
          if (typeof user === 'object' && user !== null) {
            set({ user });
          } else {
            set({ user: null });
            localStorage.removeItem('accessToken');
          }
        } catch (error) {
          console.error('Ошибка при обновлении профиля в сторе:', error);
          set({ user: null });
          localStorage.removeItem('accessToken');
        }
      },
      setUser: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null });
      },
      updateUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'user',
    },
  ),
);
