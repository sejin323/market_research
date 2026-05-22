import { notFound } from 'next/navigation';
import { getReportById } from '@/lib/supabase';
import ReportView from '@/components/ReportView';

export default async function ReportPage({ params }: { params: { id: string } }) {
  const report = await getReportById(params.id);

  if (!report || !report.data) {
    notFound();
  }

  return <ReportView report={report} />;
}
