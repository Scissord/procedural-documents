'use client';

import { IClassification, IRole, IStage } from '@/interfaces';
import { Button } from '@/components';
import { ChooseRole } from '@/components/modules/choose-role';
import { ChooseClassification } from '@/components/modules/choose-classification';
import { ChooseStage } from '@/components/modules/choose-stage';
import { ClassificationService, RoleService, StageService } from '@/services';
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

  // arrays
  const [roles, setRoles] = useState<IRole[]>([]);
  const [classifications, setClassifications] = useState<IClassification[]>([]);
  const [stages, setStages] = useState<IStage[]>([]);

  // selected
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedClassificationId, setSelectedClassificationId] = useState<
    number | null
  >(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);

  // loading
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingClassifications, setIsLoadingClassifications] =
    useState(false);
  const [isClassificationsReady, setIsClassificationsReady] = useState(false);
  const [isLoadingStages, setIsLoadingStages] = useState(false);

  const handleApiError = (response: {
    statusCode?: number;
    message?: string | string[];
  }) => {
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

  const getRoles = async () => {
    setIsLoadingRoles(true);
    const response = await RoleService.get();

    if (response.statusCode === 200) {
      setRoles(response?.data?.roles as IRole[]);
    } else {
      handleApiError(response);
    }
    setIsLoadingRoles(false);
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
    void getRoles();
  }, []);

  const handleRoleSelect = (roleId: number) => {
    setSelectedRoleId(roleId);
    setSelectedClassificationId(null);
    setSelectedStageId(null);
    setClassifications([]);
    setStages([]);
    setIsClassificationsReady(false);
    setIsLoadingStages(false);
    void getClassifications();
  };

  const handleClassificationSelect = (classificationId: number) => {
    if (!isClassificationsReady || selectedRoleId === null) {
      return;
    }

    setSelectedClassificationId(classificationId);
    setSelectedStageId(null);
    setStages([]);
    void findStagesByClassificationId(classificationId);
  };

  const handleStageSelect = (stage_id: number) => {
    setSelectedStageId(stage_id);
  };

  const canContinue =
    selectedRoleId !== null &&
    selectedClassificationId !== null &&
    selectedStageId !== null;

  const handleContinue = () => {
    if (!user?.id) {
      addNotification({
        type: 'destructive',
        title: 'Ошибка!',
        description: 'Для начала войдите в систему!',
      });
      return;
    }

    if (!canContinue) {
      return;
    }

    const params = new URLSearchParams({
      role_id: String(selectedRoleId),
      classification_id: String(selectedClassificationId),
      stage_id: String(selectedStageId),
    });

    router.push(`/documents/generate?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col gap-5">
      <ChooseRole
        roles={roles}
        selectedRoleId={selectedRoleId}
        isLoading={isLoadingRoles}
        onSelect={handleRoleSelect}
      />

      <ChooseClassification
        classifications={classifications}
        selectedClassificationId={selectedClassificationId}
        isLoading={isLoadingClassifications}
        isVisible={selectedRoleId !== null}
        onSelect={handleClassificationSelect}
      />

      <ChooseStage
        stages={stages}
        isLoading={isLoadingStages}
        isClassificationsReady={isClassificationsReady}
        isClassificationSelected={selectedClassificationId !== null}
        selectedStageId={selectedStageId}
        onSelect={handleStageSelect}
      />

      {canContinue ? (
        <div className="flex justify-end pt-2">
          <Button size="lg" onClick={handleContinue}>
            Продолжить
          </Button>
        </div>
      ) : null}
    </div>
  );
}
