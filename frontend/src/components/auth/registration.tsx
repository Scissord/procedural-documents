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

const registrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(32, 'Имя должено быть не более 32 символа'),
  password: z
    .string()
    .min(8, 'Пароль должен быть не менее 8 символов')
    .max(128, 'Пароль должен быть не более 128 символов'),
  email: z.email('Некорректный email').optional().or(z.literal('')),
});

type RegistrationFormData = z.infer<typeof registrationSchema> & {
  phone?: string; // make optional
};

export const RegistrationForm = ({
  setTab,
}: {
  setTab: Dispatch<SetStateAction<string>>;
}) => {
  const notificationsStore = useNotificationStore.getState();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      const locale = navigator.language || navigator.languages[0] || 'ru';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // const response = await AuthService.registration({
      //   ...data,
      //   locale,
      //   timezone,
      // });

      // don't like this
      // need to make this:
      // if (err.error === 'EMAIL_EXISTS') {
      //   setEmailError('Email already exists');
      // }
      // if (err.error === 'PHONE_EXISTS') {
      //   setPhoneError('Phone already exists');
      // }
      // if (typeof response === 'object') {
      //   // notification success
      //   notificationsStore.addNotification({
      //     type: 'default',
      //     title: 'Успех!',
      //     description: 'Пользователь успешно зарегестрирован.',
      //   });
      //   console.log('Успешная регистрация', response);
      //   setTab('name');
      // } else {
      //   // notification error
      //   notificationsStore.addNotification({
      //     type: 'destructive',
      //     title: 'Ошибка!',
      //     description: response,
      //   });
      // }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form
      className="space-y-4 p-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
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

      <div className="flex items-center justify-center">
        <Button variant="link">Уже есть аккаунт?</Button>
      </div>

      <Button className="w-full mt-2" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Загрузка...' : 'Зарегистрироваться'}
      </Button>
    </form>
  );
};
