'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Label,
  Input,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
  RadioGroup,
  RadioGroupItem,
} from '@/components';
import { AuthService } from '@/services';
import { ChevronDownIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { formatDate } from '@/utils';
import { useNotificationStore } from '@/store';
import { IResponse } from '@/interfaces';

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(32, 'Имя должено быть не более 32 символа'),
  password: z
    .string()
    .min(3, 'Пароль должен быть не менее 3 символов')
    .max(128, 'Пароль должен быть не более 128 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву'),
  password_verification: z
    .string()
    .min(3, 'Пароль должен быть не менее 3 символов')
    .max(128, 'Пароль должен быть не более 128 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву'),
  email: z.email('Некорректный email'),
  gender: z.enum(['male', 'female', 'other'] as const),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = ({
  setTab,
}: {
  setTab: Dispatch<SetStateAction<string>>;
}) => {
  const notificationStore = useNotificationStore.getState();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordVerification, setShowPasswordVerification] =
    useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      gender: 'male',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.password_verification) {
      notificationStore.addNotification({
        type: 'destructive',
        title: 'Ошибка',
        description: 'Пароли не совпадают!',
      });
      return;
    }

    const locale = navigator.language || navigator.languages[0] || 'ru';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const response: IResponse = await AuthService.register({
      first_name: data.name,
      email: data.email,
      password: data.password,
      gender: data.gender,
      locale,
      timezone,
    });

    if (response.statusCode === 201) {
      notificationStore.addNotification({
        type: 'default',
        title: 'Успех!',
        description: 'Пользователь успешно зарегистрирован.',
      });
      setTab('login');
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
      {/* Имя */}
      <div>
        <Label htmlFor="name">Имя</Label>
        <Input
          id="name"
          placeholder="tester"
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>
      {/* Пароль */}
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
            // variant={'ghost'}
            // size={'sm'}
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
      {/* Подтверждение пароля */}
      <div>
        <Label htmlFor="password_verification">Подтверждение пароля</Label>
        <div className="relative">
          <Input
            id="password_verification"
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            {...register('password_verification')}
            className={errors.password_verification ? 'border-red-500' : ''}
          />
          <button
            // variant={'ghost'}
            // size={'sm'}
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            onClick={() =>
              setShowPasswordVerification(!showPasswordVerification)
            }
          >
            {showPasswordVerification ? (
              <EyeOffIcon size={16} />
            ) : (
              <EyeIcon size={16} />
            )}
          </button>
        </div>
        {errors.password_verification && (
          <p className="text-red-500 text-sm mt-1">
            {errors.password_verification.message}
          </p>
        )}
      </div>
      {/* Почта */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@mail.com"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>
      {/* Пол */}
      <div>
        <Label>Пол</Label>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Мужской</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Женский</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Другой</Label>
              </div>
            </RadioGroup>
          )}
        />
        {errors.gender && (
          <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
        )}
      </div>
      <div className="flex items-center justify-center">
        <Button variant="link" onClick={() => setTab('login')}>
          Уже есть аккаунт?
        </Button>
      </div>
      <Button className="w-full mt-2" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Загрузка...' : 'Зарегистрироваться'}
      </Button>
    </form>
  );
};
