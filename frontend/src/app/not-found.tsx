import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#e9e9ea] text-[#3f4146] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-[140px] leading-none font-extrabold tracking-tight md:text-[220px]">
          404
        </h1>
        <h2 className="mt-5 text-4xl font-semibold md:text-5xl">
          Страница не найдена
        </h2>
        <p className="mt-6 text-xl text-[#55585f] md:text-2xl">
          Запрашиваемый ресурс не найден на этом сервере.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-[#3f4146] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#2f3136]"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}