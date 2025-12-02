# 설정 가이드 (Setup Guide)

## 1. 환경 변수 설정

`.env.local` 파일이 생성되었습니다. 다음 정보를 채워주세요:

### 필요한 정보:

1. **SUPABASE_SERVICE_ROLE_KEY**
   - Supabase 대시보드 > Settings > API
   - "service_role" 키 복사 (⚠️ 절대 공개하지 마세요!)

2. **DATABASE_URL**
   - Supabase 대시보드 > Settings > Database
   - "Connection string" 섹션에서 "URI" 선택
   - `[YOUR-PASSWORD]` 부분을 실제 데이터베이스 비밀번호로 교체
   - 또는 "Connection pooling" 탭에서 pooler 연결 문자열 사용

### 데이터베이스 비밀번호 찾기:
- Supabase 대시보드 > Settings > Database
- "Database password" 섹션에서 확인
- 비밀번호를 잊었다면 "Reset database password" 클릭

## 2. 의존성 설치

```bash
npm install
```

## 3. 데이터베이스 마이그레이션 실행

```bash
npm run db:push
```

이 명령어는 Drizzle을 사용하여 데이터베이스 스키마를 생성합니다.

## 4. Supabase Auth 설정

### Row Level Security (RLS) 비활성화 (개발용)

Supabase 대시보드에서:
1. Authentication > Policies
2. 각 테이블에 대해 RLS를 비활성화하거나 적절한 정책 설정

또는 SQL Editor에서:
```sql
-- RLS 비활성화 (개발용만)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE influencers DISABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors DISABLE ROW LEVEL SECURITY;
```

## 5. 첫 번째 사용자 생성

### 방법 1: Supabase 대시보드에서
1. Authentication > Users > "Add user"
2. 이메일과 비밀번호 입력
3. 생성된 사용자의 UUID 복사

### 방법 2: SQL로 직접 생성
```sql
-- Supabase Auth에서 사용자를 먼저 생성한 후
-- users 테이블에 레코드 추가
INSERT INTO users (id, email, name, role)
VALUES (
  '사용자의-UUID-여기',  -- Supabase Auth에서 생성된 사용자 ID
  'admin@example.com',
  'Admin User',
  'admin'
);
```

## 6. 시드 데이터 생성 (선택사항)

```bash
npm run seed
```

⚠️ 시드 스크립트를 실행하기 전에 최소 1명의 사용자가 `users` 테이블에 있어야 합니다.

## 7. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 8. 문제 해결

### 데이터베이스 연결 오류
- `DATABASE_URL`이 올바른지 확인
- 비밀번호에 특수문자가 있으면 URL 인코딩 필요
- Supabase 대시보드에서 데이터베이스가 활성화되어 있는지 확인

### 인증 오류
- `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- Supabase 대시보드 > Settings > API에서 키 확인

### 마이그레이션 오류
- 데이터베이스 연결 확인
- Supabase 대시보드 > Database > Tables에서 테이블이 생성되었는지 확인

## 다음 단계

1. ✅ 환경 변수 설정 완료
2. ⏳ 의존성 설치 (`npm install`)
3. ⏳ 데이터베이스 마이그레이션 (`npm run db:push`)
4. ⏳ 첫 번째 사용자 생성
5. ⏳ 개발 서버 실행 (`npm run dev`)

