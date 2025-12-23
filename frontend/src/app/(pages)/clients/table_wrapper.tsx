import { IClient } from '@/interfaces';
import { DataTableDemo } from './table';

type DataTableDemoProps = {
  data: IClient[];
};

export default async function TableWrapper({ data }: DataTableDemoProps) {
  return <DataTableDemo data={data} />;
}
