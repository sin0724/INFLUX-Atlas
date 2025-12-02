# 빠른 시작 가이드

## ✅ 완료된 작업
- ✅ 프로젝트 구조 생성
- ✅ 환경 변수 파일 생성 (`.env.local`)

## 🔧 다음 단계

### 1. 데이터베이스 비밀번호 확인 및 설정

`.env.local` 파일에서 `DATABASE_URL`의 `[YOUR-PASSWORD]`를 실제 비밀번호로 교체하세요.

**비밀번호 찾는 방법:**
1. Supabase 대시보드 접속: https://sqpplkjxpfeewwtvvdgk.supabase.co
2. Settings > Database 이동
3. "Database password" 섹션에서 확인
4. 비밀번호를 잊었다면 "Reset database password" 클릭

**`.env.local` 파일 수정:**
```env
DATABASE_URL=postgresql://postgres:실제비밀번호@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 마이그레이션 (테이블 생성)

```bash
npm run db:push
```

이 명령어는 다음 테이블들을 생성합니다:
- `users`
- `influencers`
- `influencer_notes`
- `import_batches`
- `import_errors`

### 4. 첫 번째 관리자 사용자 생성

#### 방법 A: Supabase 대시보드 사용 (권장)

1. **Supabase Auth에서 사용자 생성:**
   - Supabase 대시보드 > Authentication > Users
   - "Add user" 클릭
   - 이메일: `admin@example.com` (또는 원하는 이메일)
   - 비밀번호: 원하는 비밀번호 입력
   - "Create user" 클릭
   - 생성된 사용자의 **UUID 복사** (예: `123e4567-e89b-12d3-a456-426614174000`)

2. **users 테이블에 레코드 추가:**
   - Supabase 대시보드 > SQL Editor 이동
   - 아래 SQL 실행 (UUID를 실제 값으로 교체):

```sql
INSERT INTO users (id, email, name, role, created_at, updated_at)
VALUES (
  '여기에-복사한-UUID-입력',
  'admin@example.com',
  'Admin User',
  'admin',
  NOW(),
  NOW()
);
```

#### 방법 B: SQL 스크립트 사용

`scripts/create-admin-user.sql` 파일을 열고 UUID를 교체한 후 SQL Editor에서 실행하세요.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 6. 로그인 테스트

- 이메일: 생성한 관리자 이메일
- 비밀번호: 생성한 비밀번호

## 🎉 완료!

이제 다음 기능들을 사용할 수 있습니다:
- ✅ 대시보드에서 인플루언서 통계 확인
- ✅ 인플루언서 목록 보기 및 필터링
- ✅ Excel/CSV 파일로 인플루언서 일괄 등록 (관리자만)
- ✅ 인플루언서 상세 정보 보기 및 노트 추가

## 📝 선택사항: 시드 데이터 생성

데모 데이터를 추가하려면:

```bash
npm run seed
```

⚠️ 시드 스크립트 실행 전에 최소 1명의 사용자가 `users` 테이블에 있어야 합니다.

## 🐛 문제 해결

### 데이터베이스 연결 오류
- `DATABASE_URL`의 비밀번호가 올바른지 확인
- Supabase 대시보드에서 데이터베이스가 활성화되어 있는지 확인

### 인증 오류
- Supabase 대시보드 > Settings > API에서 키가 올바른지 확인
- `.env.local` 파일이 프로젝트 루트에 있는지 확인

### 마이그레이션 오류
- 데이터베이스 연결 확인
- Supabase 대시보드 > Database > Tables에서 테이블이 생성되었는지 확인

