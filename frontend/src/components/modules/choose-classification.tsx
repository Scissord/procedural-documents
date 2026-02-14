'use client';

import { IClassification } from '@/interfaces';
import { Loader2 } from 'lucide-react';

interface ChooseClassificationProps {
  classifications: IClassification[];
  selectedClassificationId: number | null;
  isLoading: boolean;
  onSelect: (classificationId: number) => void;
}

export function ChooseClassification({
  classifications,
  selectedClassificationId,
  isLoading,
  onSelect,
}: ChooseClassificationProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-4xl font-bold text-foreground">
        Выберите судопроизводство
      </h1>

      {isLoading ? (
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Загрузка классификаций...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classifications.map((classification) => {
            const isSelected = selectedClassificationId === classification.id;

            return (
              <button
                key={classification.id}
                type="button"
                className={`group flex min-h-24 flex-col items-start justify-between rounded-xl border p-5 text-left shadow-sm transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                    : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md'
                }`}
                onClick={() => onSelect(classification.id)}
              >
                <div className="mt-2 text-lg font-semibold text-foreground">
                  {classification.name}
                </div>
                <div className="mt-2 text-xs text-muted-foreground group-hover:text-primary">
                  Нажмите, чтобы показать стадии
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
