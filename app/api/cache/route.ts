import { type NextRequest } from 'next/server';
import { deleteCache } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  try {
    const { keyword } = await req.json() as { keyword?: string };

    if (!keyword?.trim()) {
      return Response.json({ error: '키워드를 입력해주세요.' }, { status: 400 });
    }

    const deleted = await deleteCache(keyword.trim());
    return Response.json({ success: true, deleted });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : '캐시 삭제 실패' },
      { status: 500 }
    );
  }
}
