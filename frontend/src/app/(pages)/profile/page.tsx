'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileCard } from '@/components/profile/profile-card';
import { useUserStore } from '@/store';
import { Button, Card, CardContent } from '@/components';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   const loadProfile = async () => {
  //     if (!user) {
  //       // Пытаемся загрузить профиль из стора
  //       try {
  //         await getProfile();
  //       } catch (err) {
  //         setError('Не удалось загрузить профиль');
  //         setLoading(false);
  //         return;
  //       }
  //     }
  //     setLoading(false);
  //   };

  //   loadProfile();
  // }, [user, getProfile]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive mb-4">
                {error || 'Пользователь не авторизован'}
              </p>
              <Button onClick={() => router.push('/auth')}>
                Войти в систему
              </Button>
            </CardContent>
          </Card>
        </div>
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
