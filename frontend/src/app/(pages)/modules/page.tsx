'use client';

import { IClassification, IStage } from '@/interfaces';
import { ChooseClassification } from '@/components/modules/choose-classification';
import { ChooseStage } from '@/components/modules/choose-stage';
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
  const [isLoadingClassifications, setIsLoadingClassifications] = useState(true);
  const [isClassificationsReady, setIsClassificationsReady] = useState(false);
  const [isLoadingStages, setIsLoadingStages] = useState(false);

  const handleApiError = (response: { statusCode?: number; message?: string | string[] }) => {
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
  };

  const getClassifications = async () => {
    setIsLoadingClassifications(true);
    const response = await ClassificationService.get();

    if (response.statusCode === 200) {
      setClassifications(response?.data?.classifications as IClassification[]);
      setIsClassificationsReady(true);
    } else {
      setIsClassificationsReady(false);
      handleApiError(response);
    }
    setIsLoadingClassifications(false);
  };

  const findStagesByClassificationId = async (classification_id: number) => {
    setIsLoadingStages(true);
    const response =
      await StageService.findByClassificationId(classification_id);

    if (response.statusCode === 200) {
      setStages(response?.data?.stages as IStage[]);
    } else {
      setStages([]);
      handleApiError(response);
    }

    setIsLoadingStages(false);
  };

  useEffect(() => {
    void getClassifications();
  }, []);

  const handleClassificationSelect = (classificationId: number) => {
    if (!isClassificationsReady) {
      return;
    }

    setSelectedClassificationId(classificationId);
    setStages([]);
    void findStagesByClassificationId(classificationId);
  };

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col gap-5">
      <ChooseClassification
        classifications={classifications}
        selectedClassificationId={selectedClassificationId}
        isLoading={isLoadingClassifications}
        onSelect={handleClassificationSelect}
      />

      <ChooseStage
        stages={stages}
        isLoading={isLoadingStages}
        isClassificationsReady={isClassificationsReady}
        isClassificationSelected={selectedClassificationId !== null}
      />
    </div>
  );
}
