'use client';

import { IClassification, IStage } from '@/interfaces';
import { ClassificationService, StageService } from '@/services';
import { useState, useEffect } from 'react';

export default function ModulesPage() {
  const [classifications, setClassifications] = useState<IClassification[]>([]);
  const [stages, setStages] = useState<IStage[]>([]);

  const getClassifications = async () => {
    const response = await ClassificationService.get();
    setClassifications(response.classifications.classifications);
  };

  const getStages = async (classification_id: string) => {
    const response = await StageService.get(classification_id);

    if (Array.isArray(response)) {
      setStages(response);
    } else {
      console.error(response);
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

      <div className="flex items-center justify-between">
        {classifications?.map(
          (classification: IClassification, index: number) => (
            <div
              key={classification?.id}
              id={classification?.id}
              className="p-2 border-2 border-white rounded-md bg-red-200"
              onClick={() => getStages(classification?.id)}
            >
              <div>{classification?.name}</div>
            </div>
          ),
        )}
      </div>

      <div className="flex items-center justify-between">
        {stages.map((stage: IStage, index: number) => (
          <div
            key={stage?.id}
            id={stage?.id}
            className="p-2 border-2 border-white rounded-md"
          >
            <div>{stage?.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
