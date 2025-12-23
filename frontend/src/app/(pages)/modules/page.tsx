'use client';

import { useMemo, useState } from 'react';

type CourtLevel =
  | 'Суд первой инстанции'
  | 'Суд аппеляцонной инстанции'
  | 'Суд кассационной инстанции'
  | 'Верховный суд';

export default function ModulesPage() {
  const modules = useMemo(
    () => [
      'Гражданское судопроизводство',
      'Уголовное судопроизводство',
      'Административное судопроизводство (АППК)',
      'Административное делопроизводство (КоАП)',
      'Гражданское право',
      'Уголовное право (следствие, дознание)',
    ],
    [],
  );

  const courts: CourtLevel[] = useMemo(
    () => [
      'Суд первой инстанции',
      'Суд аппеляцонной инстанции',
      'Суд кассационной инстанции',
      'Верховный суд',
    ],
    [],
  );

  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-8 text-foreground">
        Выберите модуль
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((title) => {
          const isActive = selectedModule === title;
          return (
            <button
              key={title}
              type="button"
              onClick={() =>
                setSelectedModule((prev) => (prev === title ? null : title))
              }
              className={[
                'text-left rounded-xl border bg-card text-card-foreground p-5 transition-all duration-200',
                'hover:bg-secondary-100 dark:hover:bg-primary-200',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                isActive ? 'border-secondary-100' : '',
              ].join(' ')}
            >
              <div className="text-base font-semibold">{title}</div>
              {isActive && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Выбрано
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 text-center text-secondary-100">
        Уголовное право (следствие, дознание)
      </div>

      {selectedModule && (
        <div className="mt-10 animate-slideDown">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Выберите инстанцию
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {courts.map((title) => (
              <div
                key={title}
                className="rounded-xl border bg-card text-card-foreground p-5 animate-fade-in transition-all duration-200 hover:bg-secondary-100 dark:hover:bg-primary-200"
              >
                <div className="text-base font-semibold">{title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
