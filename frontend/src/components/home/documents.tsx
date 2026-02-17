'use client';

import { Loading, TooltipProvider } from '@/components';
import { useRouter } from 'next/navigation';
import { useNotificationStore, useUserStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect, useState } from 'react';
import { IAppDocument } from '@/interfaces';
import { AppDocumentService } from '@/services';
import { Loader2 } from 'lucide-react';

export function Documents() {
  const router = useRouter();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user,
    })),
  );

  const [documents, setDocuments] = useState<IAppDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGetDocuments = async () => {
    setIsLoading(true);
    const response = await AppDocumentService.get();

    if (response.statusCode === 200 && response.data) {
      setDocuments(response.data.documents as IAppDocument[]); // важно
    } else {
      addNotification({
        type: 'destructive',
        title: 'Ошибка!',
        description: response.message as string,
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
          <h1 className="text-4xl font-bold text-foreground mb-8">Документы</h1>
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Типы документов</th>
                  <th className="px-6 py-4 font-semibold">Дата создания</th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Действия
                  </th>
                </tr>
              </thead>

              <tbody>
                {documents.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Документы отсутствуют
                    </td>
                  </tr>
                )}

                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{doc.id}</td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(doc.docs) &&
                          doc.docs.map((d: any, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium"
                            >
                              {d.title}
                            </span>
                          ))}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString('ru-RU')
                        : '—'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/documents/${doc.id}`)}
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
