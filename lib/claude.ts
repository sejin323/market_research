import Anthropic from '@anthropic-ai/sdk';
import type { ReportData, TavilyResult, PapersResult } from './types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 전문 시장조사 애널리스트입니다. 수집된 데이터를 분석하여 신뢰할 수 있는 시장 조사 리포트를 한국어로 작성합니다.

## 출처 우선순위 (수치·근거 인용 시 아래 순서대로 활용)

### 글로벌 시장 규모
1순위: Statista, Grand View Research, GlobalData, MarketsandMarkets
2순위: Euromonitor, Gartner, Frost & Sullivan
→ 수치 인용 시 출처명을 괄호로 표기하세요. 예: "2,400억 달러(Statista, 2024)"

### 국내 시장 규모
1순위: DART(dart.fss.or.kr) 사업보고서, KOTRA(대한무역투자진흥공사), KDATA(한국데이터산업진흥원)
2순위: KIET(산업연구원), KMAPS(한국의약품안전관리원/산업지식포털), 업종별 협회·진흥원 통계
3순위: 증권사 경영·경제연구소 (삼성증권·KB증권·미래에셋증권)
4순위: KPMG, 딜로이트, PwC 한국 보고서
→ 국내 시장은 별도 수치가 없으면 글로벌 대비 비율(통상 3~5%)로 추정 표기

### PEST 분석
케이맵스(KMAPS·산업지식포털) 우선 참고
바이오/헬스케어/의료기기 키워드 포함 시 아래 항목을 반드시 추가:
  - 식약처(MFDS) 허가 현황 및 규제 동향
  - 건강보험 급여 등재 여부 및 심사 기준
  - 임상시험 현황 및 규제 동향 (ClinicalTrials.gov, 식약처 임상정보)
  - 국내외 허가 기준 차이 (FDA·EMA·식약처 비교)

### 소비자·트렌드
메조미디어 인사이트M, 오픈서베이, DMC 리포트
→ 소비자 행동·인식 데이터 인용 시 출처 명시

### 키워드 트렌드
네이버 데이터랩 (수집 데이터 직접 활용), 카카오 트렌드, 블랙키위

## 공통 규칙
- 마크다운 코드 블록 없이 순수 JSON만 반환합니다
- 데이터가 불충분할 경우 합리적인 추정치를 제공하되 "(추정)" 또는 출처 표기로 신뢰도를 명시합니다
- 수치에는 반드시 연도와 출처를 포함합니다 (예: "18.5% CAGR, Grand View Research 2024")
- 위 우선순위 출처 데이터가 수집 데이터에 없더라도, 학습 지식에서 해당 출처의 공개 수치를 활용할 수 있습니다

## growthRate 분야 분류 및 고성장 판단 기준
키워드를 분석하여 아래 분야 중 하나로 분류하고, 해당 분야 기준으로 growthCategory를 결정합니다.

| 분야 | 초고성장 | 고성장 | 안정성장 | 저성장 |
|---|---|---|---|---|
| AI/반도체/우주항공 | 30%↑ | 20~30% | 10~20% | 10%↓ |
| 바이오/헬스케어/의료기기 | 15%↑ | 8~15% | 4~8% | 4%↓ |
| 전기차/신재생에너지 | 25%↑ | 15~25% | 8~15% | 8%↓ |
| 클라우드/SaaS/플랫폼 | 25%↑ | 15~25% | 8~15% | 8%↓ |
| 소비재/유통/식품 | 15%↑ | 7~15% | 3~7% | 3%↓ |
| 전통제조/철강/화학 | 10%↑ | 5~10% | 2~5% | 2%↓ |
| 금융/보험 | 12%↑ | 6~12% | 3~6% | 3%↓ |
| 기타(판단불가) | 20%↑ | 10~20% | 5~10% | 5%↓ |

- industry: 위 표의 왼쪽 열 중 하나를 정확히 입력
- cagrValue: CAGR 순수 숫자만 (예: 18.5)
- growthCategory: "초고성장" | "고성장" | "안정성장" | "저성장" 중 하나
- growthThreshold: 적용된 growthCategory의 범위 문자열 (예: "8~15%")
- isHighGrowth: growthCategory가 "고성장" 또는 "초고성장"이면 true

## references 필드 규칙
- 각 섹션의 references 배열에는 반드시 아래 "수집된 출처 목록"의 URL만 사용할 것
- 임의로 URL을 생성하거나 추측하지 마세요 (출처 목록에 없는 URL은 절대 포함 금지)
- 해당 섹션 분석에 실제 활용한 출처만 포함 (0~4개)
- trends.papers의 url 필드: [Pn] 목록에 있는 논문이면 해당 URL, 없으면 생략`;

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const status      = (e as { status?: number }).status;
      const isRetryable = status === 529 || status === 503;
      if (isRetryable && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt + 1) * 1000;
        console.warn(`[Claude] ${status} Overloaded, ${delayMs / 1000}초 후 재시도 (${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      throw e;
    }
  }
  throw new Error('최대 재시도 횟수 초과');
}

export async function analyzeWithClaude(
  keyword:      string,
  tavilyResult: TavilyResult,
  papersResult: PapersResult,
  naverData:    string
): Promise<ReportData> {
  // 수집된 출처 목록 (Claude가 references에 이 URL만 사용하도록)
  const newsSourceList = tavilyResult.sources.length
    ? tavilyResult.sources.map((s, i) => `[S${i + 1}] ${s.title}\n${s.url}`).join('\n\n')
    : '(뉴스 출처 없음)';

  const paperSourceList = papersResult.papers.length
    ? papersResult.papers.map((p, i) => `[P${i + 1}] ${p.title}\n${p.url}`).join('\n\n')
    : '(논문 출처 없음)';

  const response = await withRetry(() => anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 8192,
    system: [
      {
        type:          'text',
        text:          SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `다음 데이터를 분석하여 "${keyword}" 시장 리포트를 JSON으로 생성해주세요.

## 수집된 출처 목록 (references 배열에는 반드시 아래 URL만 사용할 것)

### 뉴스·기업 출처 (Tavily)
${newsSourceList}

### 학술 논문 (Semantic Scholar)
${paperSourceList}

---

## 뉴스 및 기업 동향 (Tavily)
${tavilyResult.text}

## 학술 논문 (Semantic Scholar)
${papersResult.text}

## 국내 검색 트렌드 (네이버 데이터랩)
${naverData}

---

아래 JSON 구조를 정확히 따르세요 (다른 텍스트 없이 JSON만 반환).

{
  "marketSize": {
    "summary": "핵심 수치와 결론만 1-2문장. 예: '글로벌 시장 약 4,200억 달러(Grand View Research 2024), 국내 약 12조 원 규모로 연평균 15% 성장 중.'",
    "tam": "글로벌 전체 시장 규모 — 출처와 연도 포함",
    "sam": "서비스 가능 시장 규모",
    "som": "획득 가능 시장 규모 — (추정) 표기",
    "description": "시장 규모 산출 근거와 배경 2-3문장",
    "references": [{"title": "출처 제목", "url": "위 목록의 URL만"}]
  },
  "growthRate": {
    "summary": "핵심 수치와 결론만 1-2문장. 예: '연평균 18.5% 성장(Frost & Sullivan), 2030년까지 고성장 지속 전망.'",
    "cagr": "연평균 성장률 문자열 — 출처·연도 포함 (예: '18.5% CAGR, Frost & Sullivan 2024~2030')",
    "cagrValue": 18.5,
    "isHighGrowth": true,
    "industry": "위 분야 분류표의 분야명 중 하나 (예: '바이오/헬스케어/의료기기')",
    "growthCategory": "초고성장 | 고성장 | 안정성장 | 저성장 중 하나",
    "growthThreshold": "적용된 growthCategory의 해당 분야 기준 범위 (예: '8~15%')",
    "description": "성장률 근거, 예측 기간, 판단 이유 2-3문장",
    "references": [{"title": "출처 제목", "url": "위 목록의 URL만"}]
  },
  "growthDrivers": {
    "summary": "핵심 동인 2-3개를 한 문장으로.",
    "pest": [
      "정치적: 관련 정책·규제",
      "경제적: 경제 환경 요인",
      "사회적: 사회·인구 변화 요인",
      "기술적: 기술 혁신 요인"
    ],
    "consumer": ["소비자 요인 1", "소비자 요인 2", "소비자 요인 3"],
    "description": "성장 동인 종합 설명 2-3문장",
    "references": [{"title": "출처 제목", "url": "위 목록의 URL만"}]
  },
  "trends": {
    "companies": [
      "기업/이슈 동향 1 — 수집된 뉴스 기반",
      "기업/이슈 동향 2",
      "기업/이슈 동향 3",
      "기업/이슈 동향 4",
      "기업/이슈 동향 5"
    ],
    "papers": [
      {"title": "논문명", "url": "해당 [Pn] 출처 URL (목록에 있을 때만)", "insight": "핵심 인사이트 1-2문장"}
    ],
    "description": "트렌드 종합 설명 2-3문장. 네이버 데이터랩 검색량 추이 언급 포함",
    "references": [{"title": "뉴스 기사 제목", "url": "위 [Sn] 목록의 URL만"}]
  },
  "marketRisk": {
    "summary": "가장 중요한 리스크를 1문장으로 핵심 요약",
    "technical": [
      {"title": "리스크명 (2~4단어 명사형)", "description": "구체적 설명 1-2문장", "level": "high"},
      {"title": "리스크명", "description": "설명", "level": "medium"}
    ],
    "business": [
      {"title": "리스크명", "description": "설명", "level": "high"},
      {"title": "리스크명", "description": "설명", "level": "medium"}
    ],
    "regulatory": [
      {"title": "리스크명", "description": "설명", "level": "medium"},
      {"title": "리스크명", "description": "설명", "level": "low"}
    ]
  },
  "relatedKeywords": [
    {"keyword": "연관 키워드 1", "reason": "연관 이유"},
    {"keyword": "연관 키워드 2", "reason": "연관 이유"},
    {"keyword": "연관 키워드 3", "reason": "연관 이유"},
    {"keyword": "연관 키워드 4", "reason": "연관 이유"},
    {"keyword": "연관 키워드 5", "reason": "연관 이유"},
    {"keyword": "연관 키워드 6", "reason": "연관 이유"},
    {"keyword": "연관 키워드 7", "reason": "연관 이유"},
    {"keyword": "연관 키워드 8", "reason": "연관 이유"}
  ],
  "charts": {
    "marketSizeTrend": {
      "data": [
        {"year": "2021", "value": 숫자},
        {"year": "2022", "value": 숫자},
        {"year": "2023", "value": 숫자},
        {"year": "2024", "value": 숫자},
        {"year": "2025", "value": 숫자},
        {"year": "2026", "value": 숫자},
        {"year": "2027", "value": 숫자}
      ],
      "unit": "억 달러 또는 조 원"
    },
    "marketSegments": {
      "tam": TAM 정수,
      "sam": SAM 정수,
      "som": SOM 정수,
      "unit": "단위 문자열"
    },
    "companyShares": [
      {"company": "1위 기업명", "share": 점유율숫자},
      {"company": "2위 기업명", "share": 점유율숫자},
      {"company": "3위 기업명", "share": 점유율숫자},
      {"company": "4위 기업명", "share": 점유율숫자},
      {"company": "기타", "share": 나머지합계}
    ]
  }
}

marketRisk 작성 규칙:
- 각 카테고리(technical/business/regulatory) 2~3개 항목
- level: "high"(시장 위협), "medium"(주의 필요), "low"(모니터링 수준)
- 해당 키워드 시장에 실질적으로 적용되는 구체적 리스크만 작성 (일반론 금지)
  · technical: 기술 미성숙·대체기술 등장·기술 장벽·핵심 특허 집중 등
  · business: 경쟁 심화·수익화 어려움·고객 채택 저조·시장 집중도 등
  · regulatory: 규제 강화·정책 변화·인허가 지연·지식재산권 분쟁 등
- 바이오/헬스케어 키워드의 regulatory에는 식약처·FDA·건강보험 심사 관련 리스크 필수 포함

charts 작성 규칙:
- marketSizeTrend.data: 과거 실적(2021-2024)과 미래 예측(2025-2027). value는 순수 숫자만.
- marketSegments: tam/sam/som 모두 동일 단위 정수. som < sam < tam 필수.
- companyShares: share 합계 = 100. 점유율 데이터 없으면 대표기업 추정치로 작성.
- keywordTrend 필드는 포함하지 마세요 (실측 데이터로 별도 주입됩니다).`,
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ],
  }));

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Claude로부터 예상치 못한 응답 형식');

  return parseClaudeJson(content.text);
}

function parseClaudeJson(raw: string): ReportData {
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error(`JSON 블록을 찾을 수 없습니다. 응답 앞부분: ${raw.slice(0, 200)}`);
  }
  const jsonStr = raw.slice(start, end + 1);

  try {
    return JSON.parse(jsonStr) as ReportData;
  } catch {
    const fixed = escapeControlCharsInStrings(jsonStr);
    try {
      return JSON.parse(fixed) as ReportData;
    } catch (e2) {
      throw new Error(
        `JSON 파싱 실패: ${(e2 as Error).message}\n` +
        `수정 후 앞부분(500자): ${fixed.slice(0, 500)}`
      );
    }
  }
}

function escapeControlCharsInStrings(json: string): string {
  let result  = '';
  let inStr   = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escaped) {
      result  += ch;
      escaped  = false;
      continue;
    }

    if (ch === '\\' && inStr) {
      result  += ch;
      escaped  = true;
      continue;
    }

    if (ch === '"') {
      inStr   = !inStr;
      result  += ch;
      continue;
    }

    if (inStr) {
      if (ch === '\n') { result += '\\n';  continue; }
      if (ch === '\r') { result += '\\r';  continue; }
      if (ch === '\t') { result += '\\t';  continue; }
      if (ch.charCodeAt(0) < 0x20) continue;
    }

    result += ch;
  }

  return result;
}
