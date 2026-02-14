'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store';
import { Loader2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { ProfileCard } from '@/components';

export default function ProfilePage() {
  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user,
    })),
  );

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || !user) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Личный кабинет</h1>
        <ProfileCard user={user} />
      </div>
    </div>
  );
}
