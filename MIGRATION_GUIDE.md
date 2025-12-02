# Username 기반 로그인 마이그레이션 가이드

## 변경 사항

이제 이메일 대신 **아이디(사용자명)**와 비밀번호로 로그인할 수 있습니다.

- 로그인 시: `admin` / `1234` 형식
- 내부적으로는 `admin@local` 형식으로 Supabase Auth에 저장됩니다.

## 데이터베이스 마이그레이션

기존 데이터베이스에 `username` 컬럼을 추가해야 합니다.

### Supabase SQL Editor에서 실행:

```sql
-- username 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 기존 사용자 업데이트 (이메일에서 username 추출)
UPDATE users 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

-- NOT NULL 제약 조건 추가
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- 관리자 사용자 업데이트
UPDATE users 
SET username = 'admin', email = 'admin@local'
WHERE email = 'admin@example.com' OR email LIKE '%admin%';
```

## 새로운 사용자 생성

### 스크립트 사용:
```bash
npm run create-admin
```

이제 다음 정보로 생성됩니다:
- 아이디: `admin`
- 비밀번호: `1234`
- 내부 이메일: `admin@local`

### 수동 생성:

1. **Supabase Auth에서 사용자 생성:**
   - Authentication > Users > Add user
   - 이메일: `원하는아이디@local` (예: `admin@local`)
   - 비밀번호: 원하는 비밀번호

2. **users 테이블에 추가:**
```sql
INSERT INTO users (id, username, email, name, role, created_at, updated_at)
VALUES (
  '사용자-UUID',
  'admin',  -- username
  'admin@local',  -- email
  'Admin',
  'admin',
  NOW(),
  NOW()
);
```

## 로그인

- URL: http://localhost:3000
- 아이디: `admin`
- 비밀번호: `1234`

## 주의사항

- Supabase Auth는 이메일을 필수로 사용하므로, 내부적으로는 `username@local` 형식으로 저장됩니다.
- 사용자에게는 username만 표시됩니다.
- 기존 이메일 기반 사용자가 있다면 위의 마이그레이션 SQL을 실행하세요.

