'use client';

import { TooltipProvider } from '@/components';
import { useRouter } from 'next/navigation';
import { useNotificationStore, useUserStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect, useState } from 'react';
import { IAppDocument } from '@/interfaces';
import { AppDocumentService } from '@/services';

export function Documents() {
  const router = useRouter();

  const addNotification = useNotificationStore((s) => s.addNotification);

  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user,
    })),
  );

  const [documents, setDocuments] = useState<IAppDocument[]>([]);

  const handleGetDocuments = async () => {
    const response = await AppDocumentService.get();

    if (response.statusCode === 200) {
      console.log(response.data);
    } else {
      console.log(response.message);
      addNotification({
        type: 'destructive',
        title: 'Ошибка!',
        description: response.message as string,
      });
    }
  };

  // useEffect(() => {
  //   handleGetDocuments();
  // }, []);

  return (
    <TooltipProvider>
      <div className="bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Документы</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        </div>
      </div>
    </TooltipProvider>
  );
}
