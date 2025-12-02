# DATABASE_URL 업데이트 가이드

## 문제
`getaddrinfo ENOTFOUND db.sqpplkjxpfeewwtvvdgk.supabase.co` 오류

이는 Supabase의 연결 문자열 형식이 변경되었거나, 호스트 이름이 잘못되었을 수 있습니다.

## 해결 방법

### 1. Supabase 대시보드에서 정확한 연결 문자열 확인

1. **Supabase 대시보드 접속**: https://sqpplkjxpfeewwtvvdgk.supabase.co
2. **Settings** > **Database** 이동
3. **Connection string** 섹션에서:
   - **URI** 탭을 클릭
   - 또는 **Connection pooling** 탭을 클릭 (권장)
4. 표시된 연결 문자열을 **전체 복사**

### 2. .env.local 파일 수정

복사한 연결 문자열을 `.env.local` 파일의 `DATABASE_URL`에 붙여넣으세요.

**중요**: 비밀번호 부분(`[YOUR-PASSWORD]`)을 실제 비밀번호(`hyun724970!`)로 교체하되, 특수문자는 URL 인코딩하세요:
- `!` → `%21`
- 따라서 `hyun724970!` → `hyun724970%21`

### 3. 예시

Supabase 대시보드에서 복사한 연결 문자열이 다음과 같다면:
```
postgresql://postgres:[YOUR-PASSWORD]@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres
```

`.env.local`에는 다음과 같이 작성:
```
DATABASE_URL=postgresql://postgres:hyun724970%21@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres
```

### 4. 연결 풀링 사용 (권장)

Supabase 대시보드에서 **Connection pooling** 탭의 연결 문자열을 사용하면 더 안정적입니다:
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 5. 서버 재시작

수정 후 개발 서버를 재시작하세요:
```bash
# 서버 중지 (Ctrl+C)
npm run dev
```

## 빠른 확인

Supabase 대시보드에서 연결 문자열을 복사한 후, 아래 명령어로 테스트할 수 있습니다:
```bash
npm run test-db-connection
```

