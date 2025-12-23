async function refreshToken(): Promise<string> {
  const response = await fetch('http://localhost:8080/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Refresh failed');
  }

  const data = await response.json();
  return data.accessToken;
}
