# 최종 설정 가이드

## ✅ 완료된 작업
- ✅ 환경 변수 설정 (`.env.local`)
- ✅ 데이터베이스 비밀번호 설정
- ✅ 관리자 사용자 생성 (Supabase Auth)

## 🔧 남은 작업

### 1. 데이터베이스 테이블 생성

**Supabase 대시보드에서 SQL Editor 열기:**
1. https://sqpplkjxpfeewwtvvdgk.supabase.co 접속
2. 좌측 메뉴에서 "SQL Editor" 클릭
3. "New query" 클릭
4. 아래 SQL 스크립트 복사하여 붙여넣기
5. "Run" 버튼 클릭

**SQL 스크립트:**
```sql
-- Enums 생성
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE platform AS ENUM ('instagram', 'threads', 'youtube', 'tiktok', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status AS ENUM ('candidate', 'active', 'blacklist');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencers 테이블
CREATE TABLE IF NOT EXISTS influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    platform platform NOT NULL,
    handle TEXT NOT NULL,
    profile_url TEXT,
    country TEXT,
    city TEXT,
    languages TEXT[],
    followers INTEGER,
    avg_likes INTEGER,
    avg_comments INTEGER,
    engagement_rate NUMERIC,
    main_category TEXT,
    sub_categories TEXT[],
    collab_types TEXT[],
    base_price_text TEXT,
    contact_email TEXT,
    contact_dm TEXT,
    status status NOT NULL DEFAULT 'candidate',
    tags TEXT[],
    notes_summary TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencer Notes 테이블
CREATE TABLE IF NOT EXISTS influencer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import Batches 테이블
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    total_rows INTEGER NOT NULL,
    success_rows INTEGER NOT NULL DEFAULT 0,
    error_rows INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import Errors 테이블
CREATE TABLE IF NOT EXISTS import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    error_message TEXT NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_influencers_platform ON influencers(platform);
CREATE INDEX IF NOT EXISTS idx_influencers_status ON influencers(status);
CREATE INDEX IF NOT EXISTS idx_influencers_created_by ON influencers(created_by);
CREATE INDEX IF NOT EXISTS idx_influencer_notes_influencer_id ON influencer_notes(influencer_id);
CREATE INDEX IF NOT EXISTS idx_import_errors_batch_id ON import_errors(batch_id);

-- 관리자 사용자 추가
INSERT INTO users (id, email, name, role, created_at, updated_at)
VALUES (
  '3da1cad8-54fb-438d-8be3-b208515fc217',
  'admin@example.com',
  'Admin',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();
```

### 2. 관리자 계정 확인

테이블 생성 후 다음 명령어 실행:

```bash
npm run create-admin
```

또는 이미 SQL 스크립트에 관리자 사용자 추가가 포함되어 있으므로, SQL만 실행해도 됩니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 로그인

- URL: http://localhost:3000
- 이메일: `admin@example.com`
- 비밀번호: `1234`

## 🎉 완료!

이제 모든 기능을 사용할 수 있습니다!

