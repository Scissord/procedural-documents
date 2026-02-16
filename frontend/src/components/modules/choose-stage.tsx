'use client';

import { IStage } from '@/interfaces';
import { Loader2 } from 'lucide-react';

interface ChooseStageProps {
  stages: IStage[];
  isLoading: boolean;
  isClassificationsReady: boolean;
  isClassificationSelected: boolean;
  selectedStageId: number | null;
  onSelect: (stageId: number) => void;
}

export function ChooseStage({
  stages,
  isLoading,
  isClassificationsReady,
  isClassificationSelected,
  selectedStageId,
  onSelect,
}: ChooseStageProps) {
  if (!isClassificationsReady) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-bold text-foreground">Выберите стадию</h1>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Стадии</h2>

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Загрузка стадий...</span>
          </div>
        ) : !isClassificationSelected ? (
          <div className="rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            Сначала выберите судопроизводство, чтобы увидеть список стадий.
          </div>
        ) : stages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            Для выбранного судопроизводства стадии пока не найдены.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage, idx) => (
              <button
                key={stage.id}
                type="button"
                className={`rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary/60 ${
                  selectedStageId === stage.id
                    ? 'border-primary ring-1 ring-primary/40'
                    : ''
                }`}
                onClick={() => onSelect(stage.id)}
              >
                <div className="text-sm text-muted-foreground">
                  Этап {idx + 1}
                </div>
                <div className="mt-1 font-medium text-foreground">
                  {stage.name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
