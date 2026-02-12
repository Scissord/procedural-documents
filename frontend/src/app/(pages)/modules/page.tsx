'use client';

import { IClassification, IStage } from '@/interfaces';
import { ClassificationService, StageService } from '@/services';
import { useNotificationStore, useUserStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

export default function ModulesPage() {
  const router = useRouter();

  const addNotification = useNotificationStore((s) => s.addNotification);

  const { user, logout } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      logout: state.logout,
    })),
  );

  const [classifications, setClassifications] = useState<IClassification[]>([]);
  const [stages, setStages] = useState<IStage[]>([]);
  const [selectedClassificationId, setSelectedClassificationId] = useState<
    number | null
  >(null);

  const getClassifications = async () => {
    const response = await ClassificationService.get();

    if (response.statusCode === 200) {
      setClassifications(response?.data?.classifications as IClassification[]);
    } else {
      if (response.statusCode === 401) {
        logout();
        router.push('/');
      } else {
        const message = Array.isArray(response.message)
          ? response.message[0]
          : response.message;

        addNotification({
          type: 'destructive',
          title: 'Ошибка!',
          description:
            message ||
            'Ошибка на стороне сервера, пожалуйста попробуйте снова.',
        });
      }
    }
  };

  const findStagesByClassificationId = async (classification_id: number) => {
    const response =
      await StageService.findByClassificationId(classification_id);

    if (response.statusCode === 200) {
      setStages(response?.data?.stages as IStage[]);
    } else {
      if (response.statusCode === 401) {
        logout();
        router.push('/');
      } else {
        const message = Array.isArray(response.message)
          ? response.message[0]
          : response.message;

        addNotification({
          type: 'destructive',
          title: 'Ошибка!',
          description:
            message ||
            'Ошибка на стороне сервера, пожалуйста попробуйте снова.',
        });
      }
    }
  };

  useEffect(() => {
    getClassifications();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col gap-5">
      <h1 className="text-4xl font-bold mb-8 text-foreground">
        Выберите судопроизводство
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classifications.map((classification: IClassification) => {
          const isSelected = selectedClassificationId
            ? +selectedClassificationId === +classification.id
            : false;

          return (
            <button
              key={classification.id}
              type="button"
              className={`group flex min-h-32 flex-col items-start justify-between rounded-xl border p-5 text-left shadow-sm transition-all duration-200 ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                  : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md'
              }`}
              onClick={() => {
                setSelectedClassificationId(classification.id);
                void findStagesByClassificationId(classification.id);
              }}
            >
              <div className="text-sm font-medium text-muted-foreground">
                {classification.code}
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">
                {classification.name}
              </div>
              <div className="mt-4 text-xs text-muted-foreground group-hover:text-primary">
                Нажмите, чтобы показать стадии
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Стадии</h2>

        {stages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            Выберите карточку судопроизводства, чтобы увидеть список стадий.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage: IStage) => (
              <div
                key={stage.id}
                className="rounded-lg border bg-background p-4 transition-colors hover:border-primary/60"
              >
                <div className="text-sm text-muted-foreground">Этап</div>
                <div className="mt-1 font-medium text-foreground">
                  {stage.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
