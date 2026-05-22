import type { PapersResult } from './types';

interface S2Paper {
  paperId:       string;
  title:         string;
  abstract:      string | null;
  year:          number | null;
  citationCount: number;
}

export async function searchPapers(keyword: string): Promise<PapersResult> {
  try {
    const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
    url.searchParams.set('query',  keyword);
    url.searchParams.set('fields', 'title,abstract,year,citationCount,paperId');
    url.searchParams.set('limit',  '10');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'MarketResearchBot/1.0' },
    });

    if (!res.ok) return { text: `논문 수집 실패 (HTTP ${res.status})`, papers: [] };

    const json: { data?: S2Paper[] } = await res.json();
    const raw: S2Paper[]             = json.data ?? [];

    if (raw.length === 0) return { text: '관련 학술 논문을 찾을 수 없습니다.', papers: [] };

    const items = raw.slice(0, 8).map((p, i) => ({
      index: i + 1,
      paper: p,
      url:   `https://www.semanticscholar.org/paper/${p.paperId}`,
    }));

    const papers = items.map(({ paper, url }) => ({ title: paper.title, url }));

    const text = items
      .map(({ index, paper, url }) => {
        const abstract = paper.abstract ? paper.abstract.slice(0, 250) : '초록 없음';
        return (
          `[P${index}] [${paper.year ?? '연도 미상'}] ${paper.title} (인용수: ${paper.citationCount})\n` +
          `URL: ${url}\n${abstract}`
        );
      })
      .join('\n\n');

    return { text, papers };
  } catch (e) {
    return {
      text:   `논문 수집 오류: ${e instanceof Error ? e.message : '알 수 없는 오류'}`,
      papers: [],
    };
  }
}
