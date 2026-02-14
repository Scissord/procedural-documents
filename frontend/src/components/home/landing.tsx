'use client';

import { Button } from '@/components';
import { useRouter } from 'next/navigation';

export function Landing() {
  const router = useRouter();

  const handleRegisterClick = () => {
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-16 px-8">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-4">
            <p className="text-lg md:text-xl text-foreground">
              Цифровая платформа юриста нового поколения
            </p>
            <p className="text-xl md:text-2xl leading-relaxed text-foreground">
              <strong>АИС «Платформа процессуальных документов»</strong> —{' '}
              <strong>автоматизированная онлайн-платформа</strong> для
              подготовки, редактирования и управления процессуальными и иными
              юридически значимыми документами для подачи в суд и сопровождения
              судебных дел на любой стадии процесса.
            </p>
            <p className="text-lg md:text-xl text-secondary-100">
              Онлайн-платформа для автоматизированной подготовки документов
            </p>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleRegisterClick}
              className="px-8 py-6 text-lg font-semibold"
            >
              Зарегистрироваться
            </Button>

            <Button
              variant="outline"
              className="px-8 py-6 text-lg font-semibold bg-transparent border-secondary-100 text-secondary-100 hover:bg-secondary-100 dark:hover:bg-primary-200 hover:text-secondary-100"
            >
              Демо
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
