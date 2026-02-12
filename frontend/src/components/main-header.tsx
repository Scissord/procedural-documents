'use client';

import { useRouter, usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from '@/components';
import { useNotificationStore, useUserStore } from '@/store';
import { IResponse } from '@/interfaces';
import { AuthService } from '@/services';
import { useShallow } from 'zustand/react/shallow';

const navItems = [
  { label: 'Главная', href: '/' },
  { label: 'О компании', href: '/about' },
  { label: 'Модули', href: '/modules' },
  { label: 'Тарифы', href: '/pricing' },
  { label: 'Контакты', href: '/contacts' },
];

export function MainHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const addNotification = useNotificationStore((s) => s.addNotification);

  const { user, logout } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      logout: state.logout,
    })),
  );

  const handleLogout = async () => {
    const response: IResponse = await AuthService.logout();

    if (response.statusCode === 200) {
      addNotification({
        type: 'default',
        title: 'Успех!',
        description: 'Пользователь успешно вышел из системы.',
      });

      logout();
      router.push('/');
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

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#d7ad61] via-[#e8c374] to-[#d7ad61] bg-clip-text text-transparent">
              GYV
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                  isActive
                    ? 'bg-secondary-100 dark:bg-primary-200 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary-100 dark:hover:bg-primary-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full hover:bg-secondary-100/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200">
                <User className="h-5 w-5 text-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.first_name || 'Пользователь'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push('/profile')}
              className="cursor-pointer"
            >
              Личный кабинет
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="cursor-pointer"
            >
              Настройки
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive"
              onClick={handleLogout}
            >
              <Button
                variant="ghost"
                className="cursor-pointer text-destructive"
              >
                Выйти
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
