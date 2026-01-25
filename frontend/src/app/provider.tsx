'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store';
import {
  Confirmation,
  Notification,
  ThemeProvider,
  FloatingThemeButton,
} from '@/components';
import { useRouter } from 'next/navigation';
// import { setup } from '@/api';

export default function Provider({ children }: { children: React.ReactNode }) {
  // const router = useRouter();
  // const { user } = useUserStore();

  // const hasAccess = user?.id;

  // useEffect(() => {
  //   if (!hasAccess) {
  //     router.push('/auth');
  //   } else {
  //     setup();
  //   }
  // }, [hasAccess]);

  return (
    <ThemeProvider>
      <Confirmation />
      <Notification />
      <FloatingThemeButton />
      {children}
    </ThemeProvider>
  );
}
