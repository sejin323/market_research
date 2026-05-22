-- 시장조사 리포트 테이블
CREATE TABLE IF NOT EXISTS reports (
  id          TEXT        PRIMARY KEY,
  keyword     TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'done'
                CHECK (status IN ('pending', 'processing', 'done', 'error')),
  data        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- 키워드 캐시 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_keyword    ON reports(keyword);
CREATE INDEX IF NOT EXISTS idx_reports_expires_at ON reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports(status);

-- Row Level Security: 서비스 키로만 쓰기, 읽기는 공개
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reports"  ON reports FOR SELECT USING (true);
CREATE POLICY "Service role can insert"  ON reports FOR INSERT WITH CHECK (true);

-- 만료된 리포트 정리 (Supabase Scheduled Jobs 또는 수동 실행)
-- DELETE FROM reports WHERE expires_at < NOW();
