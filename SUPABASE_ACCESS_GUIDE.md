# Supabase 접속 가이드

## 문제
"requested path is invalid" 오류로 Supabase 대시보드에 접속이 안 됩니다.

## 해결 방법

### 1. Supabase 대시보드 직접 접속

1. **Supabase 공식 웹사이트 접속**: https://supabase.com
2. **로그인** (Google, GitHub 등)
3. **프로젝트 목록**에서 프로젝트 선택
4. 프로젝트 이름이 `sqpplkjxpfeewwtvvdgk`이거나 비슷한 것을 찾으세요

### 2. 프로젝트 URL 확인

Supabase 대시보드에서:
- 좌측 메뉴에서 **Settings** > **API** 이동
- **Project URL** 확인
- 올바른 URL 형식: `https://[PROJECT-REF].supabase.co`

### 3. 데이터베이스 연결 문자열 확인

Supabase 대시보드에서:
- **Settings** > **Database** 이동
- **Connection string** 섹션
- **URI** 또는 **Connection pooling** 탭에서 연결 문자열 복사

### 4. 대안: Supabase CLI 사용

터미널에서:
```bash
# Supabase CLI 설치 (필요한 경우)
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref sqpplkjxpfeewwtvvdgk
```

### 5. 환경 변수 확인

`.env.local` 파일에서 다음 값들이 올바른지 확인:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

이 값들은 Supabase 대시보드 > Settings > API에서 확인할 수 있습니다.

## 빠른 확인

현재 설정된 Supabase URL이 올바른지 확인:
- `.env.local` 파일의 `NEXT_PUBLIC_SUPABASE_URL` 값
- 이 URL로 브라우저에서 직접 접속 시도

## 문제가 계속되면

1. Supabase 계정에 로그인되어 있는지 확인
2. 프로젝트가 삭제되지 않았는지 확인
3. Supabase 지원팀에 문의

