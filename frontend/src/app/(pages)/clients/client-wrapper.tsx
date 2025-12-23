'use client';

import { ProtectedRoute } from '@/components';
import { Header } from './header';
import TableWrapper from './table_wrapper';

interface ClientWrapperProps {
  data: any;
}

export default function ClientWrapper({ data }: ClientWrapperProps) {
  return (
    <ProtectedRoute>
      <div className="p-2">
        <Header />
        <TableWrapper data={data} />
      </div>
    </ProtectedRoute>
  );
}
