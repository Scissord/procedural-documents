'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@/components';
import { IUser } from '@/interfaces';
import { AuthService } from '@/services';
import { useNotificationStore, useUserStore } from '@/store';
import { formatMessageTime } from '@/utils/date_utils';

interface ProfileCardProps {
  user: IUser;
}

type EditableProfileForm = {
  first_name: string;
  last_name: string;
  middle_name: string;
  phone: string;
  birthday: string;
  gender: string;
  locale: string;
  timezone: string;
};

const EMPTY_FORM: EditableProfileForm = {
  first_name: '',
  last_name: '',
  middle_name: '',
  phone: '',
  birthday: '',
  gender: '',
  locale: '',
  timezone: '',
};

export function ProfileCard({ user }: ProfileCardProps) {
  const DEFAULT_AVATAR_SRC = '/imgs/default-avatar.png';
  const setUser = useUserStore((state) => state.setUser);
  const notificationStore = useNotificationStore();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<EditableProfileForm>(EMPTY_FORM);
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR_SRC);

  const sourceProfile = user.profile;
  const displayName =
    [
      sourceProfile?.last_name,
      sourceProfile?.first_name,
      sourceProfile?.middle_name,
    ]
      .filter(Boolean)
      .join(' ') ||
    [user.last_name, user.first_name, user.middle_name]
      .filter(Boolean)
      .join(' ') ||
    user.email;
  const rawAvatarUrl = sourceProfile?.avatar_url ?? user.avatar_url ?? '';

  const initialForm = useMemo<EditableProfileForm>(() => {
    return {
      first_name: sourceProfile?.first_name ?? user.first_name ?? '',
      last_name: sourceProfile?.last_name ?? user.last_name ?? '',
      middle_name: sourceProfile?.middle_name ?? user.middle_name ?? '',
      phone: sourceProfile?.phone ?? user.phone ?? '',
      birthday:
        String(sourceProfile?.birthday ?? user.birthday ?? '')
          .split('T')[0]
          .trim() || '',
      gender: sourceProfile?.gender ?? user.gender ?? '',
      locale: sourceProfile?.locale ?? user.locale ?? '',
      timezone: sourceProfile?.timezone ?? user.timezone ?? '',
    };
  }, [sourceProfile, user]);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  useEffect(() => {
    const nextAvatar = String(rawAvatarUrl).trim();
    setAvatarSrc(nextAvatar.length > 0 ? nextAvatar : DEFAULT_AVATAR_SRC);
  }, [rawAvatarUrl]);

  const handleFieldChange = (key: keyof EditableProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = () => {
    const payload: Partial<EditableProfileForm> = {};
    const keys = Object.keys(form) as Array<keyof EditableProfileForm>;

    for (const key of keys) {
      const currentValue = form[key].trim();
      const initialValue = initialForm[key].trim();

      if (currentValue.length === 0) {
        continue;
      }
      if (currentValue === initialValue) {
        continue;
      }

      payload[key] = currentValue;
    }

    return payload;
  };

  const handleSave = async () => {
    const payload = buildPayload();

    if (Object.keys(payload).length === 0) {
      notificationStore.addNotification({
        type: 'default',
        title: 'Нет изменений',
        description: 'Измените хотя бы одно поле, чтобы сохранить профиль.',
      });
      return;
    }

    setIsSaving(true);
    const response = await AuthService.updateProfile(payload);
    if (response.statusCode !== 200 || !response.data) {
      const message = Array.isArray(response.message)
        ? response.message[0]
        : response.message;

      notificationStore.addNotification({
        type: 'destructive',
        title: 'Ошибка',
        description: String(response.message ?? 'Не удалось обновить профиль'),
      });
      return;
    }

    setUser(response.data as unknown as IUser);
    notificationStore.addNotification({
      type: 'default',
      title: 'Успешно',
      description: 'Профиль обновлен.',
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border bg-muted">
              <img
                src={avatarSrc}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={() => setAvatarSrc(DEFAULT_AVATAR_SRC)}
              />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{displayName}</CardTitle>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Почта:</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Дата регистрации:</p>
            <p className="font-medium">
              {formatMessageTime(String(user.created_at))}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Редактирование профиля</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={form.first_name}
            onChange={(e) => handleFieldChange('first_name', e.target.value)}
            placeholder="first_name"
          />
          <Input
            value={form.last_name}
            onChange={(e) => handleFieldChange('last_name', e.target.value)}
            placeholder="last_name"
          />
          <Input
            value={form.middle_name}
            onChange={(e) => handleFieldChange('middle_name', e.target.value)}
            placeholder="middle_name"
          />
          <Input
            value={form.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="phone"
          />
          <Input
            value={form.birthday}
            onChange={(e) => handleFieldChange('birthday', e.target.value)}
            placeholder="birthday (YYYY-MM-DD)"
          />
          <Input
            value={form.gender}
            onChange={(e) => handleFieldChange('gender', e.target.value)}
            placeholder="gender"
          />
          <Input
            value={form.locale}
            onChange={(e) => handleFieldChange('locale', e.target.value)}
            placeholder="locale"
          />
          <Input
            value={form.timezone}
            onChange={(e) => handleFieldChange('timezone', e.target.value)}
            placeholder="timezone"
          />

          <div className="md:col-span-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Сохраняем...' : 'Сохранить профиль'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
