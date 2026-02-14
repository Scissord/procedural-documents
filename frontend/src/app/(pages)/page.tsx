'use client';

import { Landing, Documents } from '@/components';
import { useUserStore } from '@/store';

export default function Home() {
  const { user } = useUserStore();
  const isAuthenticated = !!user?.id;

  // Если пользователь не авторизован, показываем лендинг
  if (!isAuthenticated) {
    return <Landing />;
  }

  // Если пользователь авторизован, показываем его сгенерированные документы
  return <Documents />;
}
