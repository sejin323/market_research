export interface Reference {
  title: string;
  url:   string;
}

// ─── 데이터 수집 결과 타입 ─────────────────────────────────────────
export interface TavilyResult {
  text:    string;
  sources: Reference[];
}

export interface PapersResult {
  text:   string;
  papers: Reference[];
}

// ─── 리포트 섹션 타입 ─────────────────────────────────────────────
export interface MarketSize {
  summary:     string;
  tam:         string;
  sam:         string;
  som:         string;
  description: string;
  references?: Reference[];
}

export interface GrowthRate {
  summary:          string;
  cagr:             string;
  cagrValue?:       number;   // 순수 숫자 (예: 18.5)
  isHighGrowth:     boolean;
  industry?:        string;   // 분류된 시장 분야
  growthCategory?:  string;   // "초고성장" | "고성장" | "안정성장" | "저성장"
  growthThreshold?: string;   // 해당 카테고리 범위 (예: "8~15%")
  description:      string;
  references?:      Reference[];
}

export interface GrowthDrivers {
  summary:     string;
  pest:        string[];
  consumer:    string[];
  description: string;
  references?: Reference[];
}

export interface PaperInsight {
  title:   string;
  url?:    string;
  insight: string;
}

export interface Trends {
  companies:   string[];
  papers:      PaperInsight[];
  description: string;
  references?: Reference[];
}

export interface RelatedKeyword {
  keyword: string;
  reason:  string;
}

// ─── 차트 데이터 타입 ─────────────────────────────────────────────
export interface YearlyDataPoint {
  year:  string;
  value: number;
}

export interface MarketSizeTrendData {
  data: YearlyDataPoint[];
  unit: string;
}

export interface MarketSegmentData {
  tam:  number;
  sam:  number;
  som:  number;
  unit: string;
}

export interface CompanyShare {
  company: string;
  share:   number;
}

export interface KeywordDataPoint {
  period: string;
  ratio:  number;
}

export interface ChartData {
  marketSizeTrend: MarketSizeTrendData;
  marketSegments:  MarketSegmentData;
  companyShares:   CompanyShare[];
  keywordTrend:    KeywordDataPoint[];
}

// ─── 리스크 ───────────────────────────────────────────────────────
export interface RiskItem {
  title:       string;
  description: string;
  level:       'high' | 'medium' | 'low';
}

export interface MarketRisk {
  summary:    string;
  technical:  RiskItem[];
  business:   RiskItem[];
  regulatory: RiskItem[];
}

// ─── 리포트 전체 ──────────────────────────────────────────────────
export interface ReportData {
  marketSize:      MarketSize;
  growthRate:      GrowthRate;
  growthDrivers:   GrowthDrivers;
  trends:          Trends;
  relatedKeywords: RelatedKeyword[];
  charts?:         ChartData;
  marketRisk?:     MarketRisk;   // 리스크 분석 (optional — 구형 캐시 호환)
  sources?:        Reference[];  // 수집된 전체 출처 (Tavily + Scholar)
}

export interface Report {
  id:         string;
  keyword:    string;
  status:     'pending' | 'processing' | 'done' | 'error';
  data:       ReportData | null;
  created_at: string;
  expires_at: string;
}

export interface ProgressEvent {
  type:      'progress' | 'done' | 'error';
  step?:     string;
  message?:  string;
  reportId?: string;
  cached?:   boolean;
}

// Naver DataLab 반환 타입
export interface NaverTrendResult {
  text:      string;
  chartData: KeywordDataPoint[];
}
