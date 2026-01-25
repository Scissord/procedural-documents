// import { useNotificationStore, useUserStore } from '@/store';
// import { apiFetch } from './fetch.client';

// type ApiFetchOptions = RequestInit & {
//   retry?: boolean;
// };

// export async function handleError(
//   response: Response,
//   endpoint: string,
//   options: ApiFetchOptions,
// ) {
//   const { logout } = useUserStore.getState();
//   const notificationStore = useNotificationStore.getState();

//   // 400 — обычная ошибка
//   if (response.status === 400) {
//     notificationStore.addNotification({
//       type: 'default',
//       title: 'Ошибка',
//       description: 'Некорректные данные',
//     });
//     throw response;
//   }

//   // 401 — access token умер
//   if (response.status === 401 && !options.retry) {
//     try {
//       const newAccessToken = await refreshToken();

//       // повторяем оригинальный запрос
//       return apiFetch(endpoint, {
//         ...options,
//         retry: true,
//         headers: {
//           ...options.headers,
//           Authorization: `Bearer ${newAccessToken}`,
//         },
//       });
//     } catch {
//       logout();
//       notificationStore.addNotification({
//         type: 'default',
//         title: 'Сессия истекла',
//         description: 'Пожалуйста, войдите снова',
//       });
//       throw response;
//     }
//   }

//   // 402 — принудительный logout
//   if (response.status === 402) {
//     logout();
//     throw response;
//   }

//   // 500 — сервер
//   if (response.status === 500) {
//     notificationStore.addNotification({
//       type: 'default',
//       title: 'Ошибка сервера',
//       description: 'Попробуйте позже',
//     });
//     throw response;
//   }

//   throw response;
// }
