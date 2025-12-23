import ClientWrapper from './client-wrapper';

export default async function ClientsPage() {
  const res = await fetch('http://localhost:8080/api/clients', {
    cache: 'no-store', // без кеша
  });

  const data = await res.json();

  return <ClientWrapper data={data} />;
}
