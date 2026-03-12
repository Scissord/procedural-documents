'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store';
import { AuthService } from '@/services';
import {
  Confirmation,
  Notification,
  ThemeProvider,
  FloatingThemeButton,
} from '@/components';

export default function Provider({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((state) => state.setUser);
  const logout = useUserStore((state) => state.logout);
  const setSessionChecked = useUserStore((state) => state.setSessionChecked);

  useEffect(() => {
    let isMounted = true;

    const syncUserByCookieSession = async () => {
      try {
        const response = await AuthService.profile();
        if (!isMounted) {
          return;
        }

        if (response.statusCode === 200 && response.data) {
          setUser(response.data);
          return;
        }

        if (response.statusCode === 401) {
          logout();
          return;
        }
      } finally {
        if (isMounted) {
          setSessionChecked(true);
        }
      }
    };

    void syncUserByCookieSession();

    return () => {
      isMounted = false;
    };
  }, [logout, setSessionChecked, setUser]);

  return (
    <ThemeProvider>
      <Confirmation />
      <Notification />
      <FloatingThemeButton />
      {children}
    </ThemeProvider>
  );
}
