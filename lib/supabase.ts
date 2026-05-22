import { createClient } from '@supabase/supabase-js';
import type { Report, ReportData } from './types';

// 서버 사이드 전용 (service key 사용, 클라이언트에서 호출 금지)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function getCachedReport(keyword: string): Promise<Report | null> {
  if (process.env.DISABLE_CACHE === 'true') {
    console.log('[Cache] DISABLE_CACHE=true → 캐시 조회 건너뜀, 항상 새로 분석');
    return null;
  }

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('keyword', keyword)
    .eq('status', 'done')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Report;
}

export async function deleteCache(keyword: string): Promise<number> {
  const { error, count } = await supabase
    .from('reports')
    .delete({ count: 'exact' })
    .eq('keyword', keyword);

  if (error) throw new Error(`캐시 삭제 실패: ${error.message}`);
  return count ?? 0;
}

export async function saveReport(keyword: string, reportData: ReportData): Promise<string> {
  const id = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase.from('reports').insert({
    id,
    keyword,
    status: 'done',
    data: reportData,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(`Supabase 저장 실패: ${error.message}`);
  return id;
}

export async function getReportById(id: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Report;
}
