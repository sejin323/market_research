import { type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { keywords } = await req.json() as { keywords?: unknown };

    if (!Array.isArray(keywords) || keywords.length < 2) {
      return Response.json({ error: '2개 이상의 키워드가 필요합니다.' }, { status: 400 });
    }

    const kwList = (keywords as string[]).map(k => String(k).trim()).filter(Boolean);

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `다음 키워드들이 공통으로 가리키는 시장/주제를 파악하여 JSON만 반환하세요.

키워드: ${kwList.join(', ')}

{"unifiedTopic": "공통 시장·주제명 (영문명/약어 포함)", "explanation": "1-2문장 설명"}

규칙:
- unifiedTopic: 시장조사 리포트 제목으로 쓸 전문적 한국어 명칭, 영문명이 있으면 괄호로 포함
- 다른 텍스트 없이 JSON만 반환`,
        },
      ],
    });

    const text  = response.content[0].type === 'text' ? response.content[0].text : '';
    const start = text.indexOf('{');
    const end   = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return Response.json({ error: 'AI 응답 파싱 실패' }, { status: 500 });
    }

    const result = JSON.parse(text.slice(start, end + 1)) as {
      unifiedTopic: string;
      explanation:  string;
    };
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : '주제 분석 실패' },
      { status: 500 }
    );
  }
}
