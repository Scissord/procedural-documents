'use client';

import { Loader2 } from 'lucide-react';

export const Loading = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Загрузка страницы документа...</span>
      </div>
    </div>
  );
};
