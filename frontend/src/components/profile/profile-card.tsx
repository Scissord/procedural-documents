'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components';
import { IUser } from '@/interfaces';
import { User, Mail, Phone, Calendar, MapPin, Clock, Edit2, Check, X } from 'lucide-react';
import { AuthService } from '@/services';
import { useUserStore } from '@/store';
import { useNotificationStore } from '@/store';

interface ProfileCardProps {
  user: IUser;
}

export function ProfileCard({ user: initialUser }: ProfileCardProps) {
  const { user, updateUser } = useUserStore();
  const notificationsStore = useNotificationStore.getState();
  const currentUser = user || initialUser;
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(currentUser?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Не указано';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Не указано';
      return d.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Не указано';
    }
  };

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      male: 'Мужской',
      female: 'Женский',
      other: 'Другой',
    };
    return labels[gender] || gender;
  };

  const fullName = [
    currentUser?.last_name,
    currentUser?.first_name,
    currentUser?.middle_name,
  ]
    .filter(Boolean)
    .join(' ') || currentUser?.first_name || 'Не указано';

  const handleSavePhone = async () => {
    setIsSaving(true);
    try {
      const result = await AuthService.updateProfile({ phone: phoneValue || undefined });

      if (typeof result === 'object' && result !== null) {
        updateUser(result);
        setIsEditingPhone(false);
        notificationsStore.addNotification({
          type: 'default',
          title: 'Успех!',
          description: 'Телефон успешно обновлен.',
        });
      } else {
        notificationsStore.addNotification({
          type: 'destructive',
          title: 'Ошибка!',
          description: typeof result === 'string' ? result : 'Не удалось обновить телефон',
        });
      }
    } catch (error) {
      notificationsStore.addNotification({
        type: 'destructive',
        title: 'Ошибка!',
        description: 'Произошла ошибка при обновлении телефона',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    const current = user || initialUser;
    setPhoneValue(current?.phone || '');
    setIsEditingPhone(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={fullName}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">{fullName}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Пользователь с {formatDate(currentUser?.created_at)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{currentUser?.email || 'Не указано'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Телефон</p>
                {isEditingPhone ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value)}
                      placeholder="+7 (999) 123-45-67"
                      className="flex-1"
                      disabled={isSaving}
                    />
                    <Button
                      size="sm"
                      onClick={handleSavePhone}
                      disabled={isSaving}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{currentUser?.phone || 'Не указано'}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingPhone(true)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {currentUser?.birthday && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Дата рождения</p>
                  <p className="font-medium">{formatDate(currentUser.birthday)}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Пол</p>
                <p className="font-medium">{getGenderLabel(currentUser?.gender || '')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Часовой пояс</p>
                <p className="font-medium">{currentUser?.timezone || 'Не указано'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Дата регистрации</p>
                <p className="font-medium">{formatDate(currentUser?.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
