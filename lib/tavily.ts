import type { TavilyResult } from './types';

export async function searchTavily(keyword: string): Promise<TavilyResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { text: '뉴스 데이터를 가져올 수 없습니다. (TAVILY_API_KEY 미설정)', sources: [] };
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key:        apiKey,
        query:          `${keyword} 시장 동향 기업 투자 2024 2025`,
        search_depth:   'advanced',
        include_answer: true,
        max_results:    10,
      }),
    });

    if (!res.ok) return { text: `뉴스 수집 실패 (HTTP ${res.status})`, sources: [] };

    const json    = await res.json();
    const results = (json.results as Array<{ title: string; content: string; url: string }>).slice(0, 8);

    const sources = results.map(r => ({ title: r.title, url: r.url }));

    const summary  = json.answer ? `[요약]\n${json.answer}\n\n` : '';
    const articles = results
      .map((r, i) => `[S${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 400)}`)
      .join('\n\n');

    return { text: summary + articles, sources };
  } catch (e) {
    return {
      text:    `뉴스 수집 오류: ${e instanceof Error ? e.message : '알 수 없는 오류'}`,
      sources: [],
    };
  }
}
