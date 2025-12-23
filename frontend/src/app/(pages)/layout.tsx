import { Footer, MainHeader } from '@/components';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MainHeader />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
