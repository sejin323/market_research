import { Client } from '@notionhq/client';
import type { ReportData } from './types';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ─── Rich text helper ─────────────────────────────────────────────────
function rt(text: string) {
  const safe = (text ?? '').length > 1900 ? text.slice(0, 1900) + '…' : (text ?? '');
  return [{ text: { content: safe } }];
}

// ─── Block builders ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type B = Record<string, any>;

const h1       = (t: string): B => ({ type: 'heading_1',          heading_1:          { rich_text: rt(t) } });
const h2       = (t: string): B => ({ type: 'heading_2',          heading_2:          { rich_text: rt(t) } });
const para     = (t: string): B => ({ type: 'paragraph',          paragraph:          { rich_text: rt(t) } });
const bullet   = (t: string): B => ({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: rt(t) } });
const numbered = (t: string): B => ({ type: 'numbered_list_item', numbered_list_item: { rich_text: rt(t) } });
const divider  = ():          B => ({ type: 'divider',            divider:            {} });

const callout = (t: string, emoji = '💡'): B => ({
  type:    'callout',
  callout: { rich_text: rt(t), icon: { type: 'emoji', emoji } },
});

function tbl(headers: string[], rows: string[][]): B {
  return {
    type:  'table',
    table: {
      table_width:       headers.length,
      has_column_header: true,
      has_row_header:    false,
      children: [
        { type: 'table_row', table_row: { cells: headers.map(h => rt(h)) } },
        ...rows.map(row => ({
          type:      'table_row',
          table_row: { cells: row.map(c => rt(String(c ?? ''))) },
        })),
      ],
    },
  };
}

// ─── 리포트 → Notion 블록 변환 ───────────────────────────────────────
function buildBlocks(keyword: string, reportUrl: string, data: ReportData): B[] {
  const blocks: B[] = [];

  blocks.push(para(`🔗 원본 리포트: ${reportUrl}`));
  blocks.push(para(`📅 분석 일시: ${new Date().toLocaleDateString('ko-KR')}`));
  blocks.push(divider());

  // ── 1. 시장 규모 ──────────────────────────────────────────────────
  blocks.push(h1('📊 시장 규모'));
  if (data.marketSize.summary) blocks.push(callout(data.marketSize.summary, '📌'));
  blocks.push(tbl(
    ['구분', '시장 규모'],
    [
      ['TAM (전체 시장)',   data.marketSize.tam],
      ['SAM (서비스 가능)', data.marketSize.sam],
      ['SOM (획득 가능)',   data.marketSize.som],
    ]
  ));
  blocks.push(para(data.marketSize.description));
  blocks.push(divider());

  // ── 2. 시장 성장률 ────────────────────────────────────────────────
  blocks.push(h1('📈 시장 성장률'));
  if (data.growthRate.summary) blocks.push(callout(data.growthRate.summary, '📌'));
  const growthRows: string[][] = [
    ['CAGR (연평균 성장률)', data.growthRate.cagr],
  ];
  if (data.growthRate.industry)        growthRows.push(['시장 분야',  data.growthRate.industry]);
  if (data.growthRate.growthCategory)  growthRows.push(['성장 등급',  data.growthRate.growthCategory]);
  if (data.growthRate.growthThreshold) growthRows.push(['해당 기준 범위', data.growthRate.growthThreshold]);
  growthRows.push(['고성장 여부', data.growthRate.isHighGrowth ? '✅ 고성장 이상' : '📊 안정성장 이하']);
  blocks.push(tbl(['지표', '수치'], growthRows));
  blocks.push(para(data.growthRate.description));
  blocks.push(divider());

  // ── 3. 성장 동인 ─────────────────────────────────────────────────
  blocks.push(h1('🔍 성장 동인'));
  if (data.growthDrivers.summary) blocks.push(callout(data.growthDrivers.summary, '📌'));
  blocks.push(h2('PEST 거시환경'));
  data.growthDrivers.pest.forEach(item => blocks.push(bullet(item)));
  blocks.push(h2('소비자 미시환경'));
  data.growthDrivers.consumer.forEach(item => blocks.push(bullet(item)));
  blocks.push(para(data.growthDrivers.description));
  blocks.push(divider());

  // ── 3-b. 시장 리스크 ─────────────────────────────────────────────
  if (data.marketRisk) {
    const { summary, technical, business, regulatory } = data.marketRisk;
    const LEVEL_KO: Record<string, string> = { high: '고위험', medium: '중위험', low: '저위험' };
    blocks.push(h1('⚠️ 시장 리스크 분석'));
    if (summary) blocks.push(callout(summary, '⚠️'));
    const riskCats: [string, typeof technical][] = [
      ['⚙️ 기술적 리스크',    technical  ],
      ['💼 사업적 리스크',    business   ],
      ['⚖️ 규제/정책 리스크', regulatory ],
    ];
    riskCats.forEach(([title, items]) => {
      if (items?.length) {
        blocks.push(h2(title));
        items.forEach(r =>
          blocks.push(bullet(`[${LEVEL_KO[r.level] ?? r.level}] ${r.title}: ${r.description}`))
        );
      }
    });
    blocks.push(divider());
  }

  // ── 4. 기업 & 논문 동향 ───────────────────────────────────────────
  blocks.push(h1('🏢 기업 & 논문 동향'));
  blocks.push(h2('기업 및 이슈'));
  data.trends.companies.forEach(item => blocks.push(numbered(item)));
  if (data.trends.papers.length > 0) {
    blocks.push(h2('학술 동향'));
    blocks.push(tbl(
      ['논문 / 리서치', '핵심 인사이트'],
      data.trends.papers.map(p => [p.title, p.insight])
    ));
  }
  blocks.push(para(data.trends.description));
  blocks.push(divider());

  // ── 5. 연관 키워드 ────────────────────────────────────────────────
  blocks.push(h1('🔗 연관 키워드'));
  blocks.push(tbl(
    ['키워드', '연관 이유'],
    data.relatedKeywords.map(k => [k.keyword, k.reason])
  ));
  blocks.push(divider());

  // ── 6. 차트 수치 데이터 ───────────────────────────────────────────
  if (data.charts) {
    blocks.push(h1('📊 차트 수치 데이터'));

    if (data.charts.marketSizeTrend?.data?.length) {
      const unit = data.charts.marketSizeTrend.unit;
      blocks.push(h2(`시장 규모 연도별 추이 (단위: ${unit})`));
      blocks.push(tbl(
        ['연도', `시장 규모 (${unit})`],
        data.charts.marketSizeTrend.data.map(d => [d.year, String(d.value)])
      ));
    }

    if (data.charts.marketSegments?.tam) {
      const { tam, sam, som, unit } = data.charts.marketSegments;
      blocks.push(h2(`TAM / SAM / SOM 수치 (단위: ${unit})`));
      blocks.push(tbl(
        ['구분', `규모 (${unit})`, 'TAM 대비 비율'],
        [
          ['TAM', String(tam), '100%'],
          ['SAM', String(sam), `${((sam / tam) * 100).toFixed(1)}%`],
          ['SOM', String(som), `${((som / tam) * 100).toFixed(1)}%`],
        ]
      ));
    }

    if (data.charts.companyShares?.length) {
      blocks.push(h2('기업별 시장 점유율'));
      blocks.push(tbl(
        ['기업', '점유율 (%)'],
        data.charts.companyShares.map(c => [c.company, String(c.share)])
      ));
    }

    if (data.charts.keywordTrend?.length) {
      blocks.push(h2(`키워드 검색량 추이 — "${keyword}" (네이버 데이터랩)`));
      blocks.push(tbl(
        ['기간', '검색량 지수 (0-100)'],
        data.charts.keywordTrend.map(k => [k.period, String(k.ratio)])
      ));
    }
  }

  return blocks;
}

// ─── 메인 export ─────────────────────────────────────────────────────
export async function createNotionReport(
  keyword:   string,
  reportUrl: string,
  data:      ReportData
): Promise<string> {
  const pageId = process.env.NOTION_PAGE_ID!;
  const blocks = buildBlocks(keyword, reportUrl, data);

  // 하위 페이지 제목: "[키워드] - YYYY-MM-DD"
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\.\s*/g, '-').replace(/-$/, '');
  const pageTitle = `${keyword} - ${dateStr}`;

  const CHUNK = 100;
  const firstChunk = blocks.slice(0, CHUNK);
  const restChunks: B[][] = [];
  for (let i = CHUNK; i < blocks.length; i += CHUNK) {
    restChunks.push(blocks.slice(i, i + CHUNK));
  }

  // 부모 페이지 하위에 새 페이지 생성
  const page = await notion.pages.create({
    parent:     { page_id: pageId },
    properties: {
      title: {
        title: [{ text: { content: pageTitle } }],
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: firstChunk as any,
  });

  for (const chunk of restChunks) {
    await notion.blocks.children.append({
      block_id: page.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: chunk as any,
    });
  }

  return (page as { url: string }).url;
}
