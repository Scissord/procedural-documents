'use client';

import { Landing, ModulesGrid } from '@/components';
import { useUserStore } from '@/store';

export default function Home() {
  const { user } = useUserStore();
  const isAuthenticated = !!user?.id;

  // Если пользователь не авторизован, показываем лендинг
  if (!isAuthenticated) {
    return <Landing />;
  }

  // Если пользователь авторизован, показываем модули
  return <ModulesGrid />;
}
