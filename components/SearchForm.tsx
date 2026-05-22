'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, CheckCircle2, AlertCircle, RefreshCw, Sparkles, X } from 'lucide-react';
import type { ProgressEvent } from '@/lib/types';

const STEPS = [
  { key: 'cache',      label: '캐시 확인' },
  { key: 'collecting', label: '데이터 수집 (뉴스·논문·트렌드)' },
  { key: 'analyzing',  label: 'Claude AI 분석' },
  { key: 'saving',     label: '결과 저장' },
];

type Phase = 'idle' | 'identifying' | 'confirming' | 'analyzing';

interface Props {
  initialKeyword?: string;
  initialForce?:   boolean;
}

export default function SearchForm({ initialKeyword = '', initialForce = false }: Props) {
  const [keyword, setKeyword]           = useState(initialKeyword);
  const [force, setForce]               = useState(initialForce);
  const [isLoading, setIsLoading]       = useState(false);
  const [currentStep, setCurrentStep]   = useState('');
  const [statusMsg, setStatusMsg]       = useState('');
  const [error, setError]               = useState('');

  // 멀티 키워드 통합 분석 상태
  const [phase, setPhase]               = useState<Phase>('idle');
  const [unifiedTopic, setUnifiedTopic] = useState('');
  const [editedTopic, setEditedTopic]   = useState('');
  const [topicExplanation, setTopicExplanation] = useState('');
  const [originalKeywords, setOriginalKeywords] = useState<string[]>([]);

  const router   = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  // 핵심 분석 로직 (단일 키워드)
  const runAnalysis = async (kw: string) => {
    setIsLoading(true);
    setError('');
    setCurrentStep('cache');
    setStatusMsg(force ? '강제 재분석을 시작합니다...' : '분석을 시작합니다...');

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ keyword: kw, force }),
        signal:  abortRef.current.signal,
      });

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const event: ProgressEvent = JSON.parse(line.slice(6));

          if (event.type === 'progress') {
            setCurrentStep(event.step ?? '');
            setStatusMsg(event.message ?? '');
          } else if (event.type === 'done' && event.reportId) {
            router.push(`/report/${event.reportId}`);
            return;
          } else if (event.type === 'error') {
            setError(event.message ?? '오류가 발생했습니다.');
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('서버 연결에 실패했습니다. 다시 시도해주세요.');
      }
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const kw = keyword.trim();
    if (!kw || isLoading || phase === 'identifying') return;

    setError('');

    // 쉼표로 구분된 멀티 키워드 감지
    const keywords = kw.split(',').map(k => k.trim()).filter(Boolean);

    if (keywords.length > 1) {
      // 멀티 키워드 → 주제 통합 분석
      setOriginalKeywords(keywords);
      setPhase('identifying');

      try {
        const res = await fetch('/api/identify-topic', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ keywords }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? '주제 분석 실패');

        setUnifiedTopic(data.unifiedTopic);
        setEditedTopic(data.unifiedTopic);
        setTopicExplanation(data.explanation);
        setPhase('confirming');
      } catch (e) {
        setError(e instanceof Error ? e.message : '주제 통합 분석에 실패했습니다.');
        setPhase('idle');
      }
      return;
    }

    // 단일 키워드 → 바로 분석
    await runAnalysis(kw);
  };

  const handleConfirmTopic = async () => {
    const topic = editedTopic.trim() || unifiedTopic;
    setPhase('idle');
    // 통합된 단일 주제로 분석
    await runAnalysis(topic);
  };

  const handleCancelConfirm = () => {
    setPhase('idle');
    setUnifiedTopic('');
    setEditedTopic('');
    setTopicExplanation('');
  };

  const stepStatus = (key: string) => {
    const idx = STEPS.findIndex(s => s.key === key);
    const cur = STEPS.findIndex(s => s.key === currentStep);
    if (idx < cur) return 'done';
    if (idx === cur) return 'active';
    return 'pending';
  };

  const isFormDisabled = isLoading || phase === 'identifying' || phase === 'confirming';

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="flex gap-3 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="예: 전기차 배터리 — 또는 쉼표로 여러 키워드 입력"
            disabled={isFormDisabled}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
        <button
          type="submit"
          disabled={isFormDisabled || !keyword.trim()}
          className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          {phase === 'identifying'
            ? <><Loader2 className="w-4 h-4 animate-spin" />분석 중</>
            : isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />분석 중</>
            : force
            ? <><RefreshCw className="w-4 h-4" />강제 재분석</>
            : '분석 시작'}
        </button>
      </form>

      {/* 캐시 무시 토글 */}
      <label className="flex items-center gap-2 mb-5 cursor-pointer w-fit group">
        <div
          onClick={() => !isFormDisabled && setForce(f => !f)}
          className={`relative w-8 h-4 rounded-full transition-colors ${
            force ? 'bg-orange-500' : 'bg-gray-200'
          } ${isFormDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
              force ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </div>
        <span className={`text-xs ${force ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
          {force ? '캐시 무시 — 새로 분석' : '캐시 사용 (7일 이내 결과 재활용)'}
        </span>
      </label>

      {/* 주제 통합 확인 카드 */}
      {phase === 'confirming' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 mb-1">키워드 통합 분석</p>
              <p className="text-xs text-blue-600 mb-1">
                입력 키워드: {originalKeywords.join(', ')}
              </p>
              <p className="text-xs text-blue-700 mb-3 leading-relaxed">{topicExplanation}</p>

              <p className="text-xs font-medium text-blue-800 mb-1.5">통합된 분석 주제</p>
              <input
                value={editedTopic}
                onChange={e => setEditedTopic(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleCancelConfirm}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                >
                  <X className="w-3 h-3" />
                  취소
                </button>
                <button
                  onClick={handleConfirmTopic}
                  disabled={!editedTopic.trim()}
                  className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  이 주제로 분석 시작 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 분석 진행 상황 */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <p className="text-sm text-gray-500 mb-4">{statusMsg}</p>
          <div className="space-y-3">
            {STEPS.map(step => {
              const s = stepStatus(step.key);
              return (
                <div key={step.key} className="flex items-center gap-3">
                  {s === 'done'
                    ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    : s === 'active'
                    ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
                    : <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
                  }
                  <span className={`text-sm ${
                    s === 'active' ? 'text-blue-600 font-medium' :
                    s === 'done'   ? 'text-gray-400 line-through' :
                                     'text-gray-400'
                  }`}>
                    {step.key === 'cache' && force ? '캐시 무시 (강제 재분석)' : step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
