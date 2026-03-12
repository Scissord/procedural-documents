'use client';

import { Loading, TooltipProvider } from '@/components';
import { useRouter } from 'next/navigation';
import { useNotificationStore, useUserStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect, useState } from 'react';
import { ICase } from '@/interfaces';
import { CaseService } from '@/services';

export function Documents() {
  const router = useRouter();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const { logout } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      logout: state.logout,
    })),
  );

  const [cases, setCases] = useState<ICase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGetDocuments = async () => {
    setIsLoading(true);
    const response = await CaseService.get();

    if (response.statusCode === 200 && response.data) {
      setCases(response.data.cases as ICase[]);
    } else {
      if (response.statusCode === 401) {
        logout();
        router.push('/');
        return;
      }

      const message = Array.isArray(response.message)
        ? response.message[0]
        : response.message;

      addNotification({
        type: 'destructive',
        title: 'Ошибка!',
        description:
          message || 'Ошибка на стороне сервера, пожалуйста попробуйте снова.',
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    handleGetDocuments();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <TooltipProvider>
      <div className="bg-background p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Кейсы</h1>
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-6 py-4 font-semibold">№</th>
                  <th className="px-6 py-4 font-semibold">Дата создания</th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Действия
                  </th>
                </tr>
              </thead>

              <tbody>
                {cases.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Кейсы отсутствуют
                    </td>
                  </tr>
                )}

                {cases.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{idx + 1}</td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString('ru-RU')
                        : '—'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/cases/${c.id}`)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
