# 데이터베이스 연결 오류 해결 방법

## 문제
`getaddrinfo ENOTFOUND db.sqpplkjxpfeewwtvvdgk.supabase.co` 오류

## 해결 방법

### 1. Supabase 대시보드에서 정확한 연결 문자열 확인

1. Supabase 대시보드 접속: https://sqpplkjxpfeewwtvvdgk.supabase.co
2. **Settings** > **Database** 이동
3. **Connection string** 섹션에서:
   - **URI** 탭 선택
   - 또는 **Connection pooling** 탭 선택 (권장)

### 2. 연결 문자열 형식

Supabase는 두 가지 연결 방식을 제공합니다:

#### 방법 A: 직접 연결 (Direct Connection)
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### 방법 B: 연결 풀링 (Connection Pooling) - 권장
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 3. 비밀번호 URL 인코딩

비밀번호에 특수문자(`!`, `@`, `#` 등)가 있으면 URL 인코딩이 필요합니다:

- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `*` → `%2A`
- `(` → `%28`
- `)` → `%29`
- `+` → `%2B`
- `=` → `%3D`

예: `hyun724970!` → `hyun724970%21`

### 4. .env.local 파일 수정

`.env.local` 파일을 열고 `DATABASE_URL`을 수정하세요:

```env
# 방법 1: 직접 연결 (비밀번호 URL 인코딩 필요)
DATABASE_URL=postgresql://postgres:hyun724970%21@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres

# 방법 2: 연결 풀링 (권장, Supabase 대시보드에서 복사)
DATABASE_URL=postgresql://postgres.sqpplkjxpfeewwtvvdgk:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 5. 확인

수정 후 개발 서버를 재시작하세요:

```bash
# 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
```

## 빠른 해결책

Supabase 대시보드에서 **Connection string** > **URI** 또는 **Connection pooling**을 복사하여 `.env.local`의 `DATABASE_URL`에 붙여넣으세요.

