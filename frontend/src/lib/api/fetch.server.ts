// // 👉 Server Components / Route Handlers / Server Actions
// // 👉 НЕЛЬЗЯ:

// // Zustand

// // уведомления

// // window / document

// // 👉 ВСЁ через cookies + headers

// import { cookies, headers } from 'next/headers';

// const BASE_URL = process.env.API_URL!;

// export async function apiFetchServer<T>(
//   path: string,
//   options: RequestInit = {},
// ): Promise<T> {
//   const cookieStore = cookies();

//   const accessToken = cookieStore.get('access_token')?.value;

//   const reqHeaders = new Headers(options.headers);

//   if (accessToken) {
//     reqHeaders.set('Authorization', `Bearer ${accessToken}`);
//   }

//   reqHeaders.set('Content-Type', 'application/json');

//   const response = await fetch(`${BASE_URL}${path}`, {
//     ...options,
//     headers: reqHeaders,
//     credentials: 'include',
//     cache: 'no-store', // часто важно
//   });

//   if (!response.ok) {
//     throw new Error(`API error ${response.status}: ${await response.text()}`);
//   }

//   return response.json();
// }
