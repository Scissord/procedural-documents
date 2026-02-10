'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label, Input, Button, Checkbox } from '@/components';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { AuthService } from '@/services';
import { useRouter } from 'next/navigation';
import { useNotificationStore, useUserStore } from '@/store';
import { ILoginOutput, IResponse, IUserLogin } from '@/interfaces';

const loginSchema = z.object({
  email: z.email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Пароль должен быть не менее 8 символов')
    .max(128, 'Пароль должен быть не более 128 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const router = useRouter();

  const userStore = useUserStore.getState();
  const notificationStore = useNotificationStore.getState();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    const response: IResponse = await AuthService.login(data);

    if (response.statusCode === 200) {
      notificationStore.addNotification({
        type: 'default',
        title: 'Успех!',
        description: 'Пользователь успешно авторизован.',
      });
      userStore.setUser(response?.data?.user);
      router.push('/document/generate');
    } else {
      const message = Array.isArray(response.message)
        ? response.message[0]
        : response.message;

      notificationStore.addNotification({
        type: 'destructive',
        title: 'Ошибка!',
        description:
          message || 'Ошибка на стороне сервера, пожалуйста попробуйте снова.',
      });
    }
  };

  return (
    <form
      className="space-y-4 p-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div>
        <Label htmlFor="email">Почта</Label>
        <Input
          id="email"
          placeholder="tester"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Input
            id="password"
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className={errors.password ? 'border-red-500' : ''}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Checkbox id="remember-me" />
        <Label htmlFor="remember-me" className="ml-2">
          Запомнить меня
        </Label>
        <Button variant="link" className="ml-auto p-0">
          Забыли пароль?
        </Button>
      </div>

      <Button className="w-full mt-2" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Загрузка...' : 'Войти'}
      </Button>
    </form>
  );
};
