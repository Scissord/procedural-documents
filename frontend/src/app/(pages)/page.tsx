'use client';

import { Landing, Documents } from '@/components';
import { useUserStore } from '@/store';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isSessionChecked } = useUserStore();
  const isAuthenticated = !!user?.id;

  if (!isSessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Если пользователь не авторизован, показываем лендинг
  if (!isAuthenticated) {
    return <Landing />;
  }

  // Если пользователь авторизован, показываем его сгенерированные документы
  return <Documents />;
}
