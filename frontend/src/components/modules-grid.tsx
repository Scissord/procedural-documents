'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
} from '@/components';
import { useRouter } from 'next/navigation';
import { Users, FileText, Settings, BarChart3 } from 'lucide-react';
import { useUserStore } from '@/store';

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const modules: Module[] = [
  {
    id: 'clients',
    title: 'Клиенты',
    description: 'Управление клиентской базой',
    icon: <Users className="w-8 h-8" />,
    href: '/clients',
  },
  {
    id: 'documents',
    title: 'Документы',
    description: 'Работа с документами',
    icon: <FileText className="w-8 h-8" />,
    href: '#',
  },
  {
    id: 'analytics',
    title: 'Аналитика',
    description: 'Статистика и отчеты',
    icon: <BarChart3 className="w-8 h-8" />,
    href: '#',
  },
  {
    id: 'settings',
    title: 'Настройки',
    description: 'Настройки системы',
    icon: <Settings className="w-8 h-8" />,
    href: '#',
  },
];

interface ModulesGridProps {
  showTitle?: boolean;
}

export function ModulesGrid({ showTitle = true }: ModulesGridProps) {
  const router = useRouter();
  const { user } = useUserStore();
  const isAuthenticated = !!user?.id;

  const handleModuleClick = (module: Module) => {
    if (isAuthenticated) {
      router.push(module.href);
    }
  };

  const handleLoginClick = () => {
    router.push('/auth');
  };

  return (
    <TooltipProvider>
      <div className="bg-background p-8">
        <div className="max-w-7xl mx-auto">
          {showTitle && (
            <h1 className="text-4xl font-bold text-foreground mb-8">
              Доступные модули
            </h1>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Tooltip key={module.id}>
                <TooltipTrigger asChild>
                  <Card
                    className={`transition-all duration-200 ${
                      isAuthenticated
                        ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:border-secondary-100/50'
                        : 'opacity-70 cursor-not-allowed'
                    }`}
                    onClick={() => handleModuleClick(module)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-primary">{module.icon}</div>
                        <CardTitle>{module.title}</CardTitle>
                      </div>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isAuthenticated && (
                        <p className="text-sm text-muted-foreground italic">
                          Необходимо войти в систему
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                {!isAuthenticated && (
                  <TooltipContent>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm">Необходимо войти в систему</p>
                      <Button
                        onClick={handleLoginClick}
                        size="sm"
                        className="w-full"
                      >
                        Войти
                      </Button>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
