# Supabase 대시보드 접속 방법

## 문제
"requested path is invalid" 오류로 Supabase 대시보드에 접속이 안 됩니다.

## 올바른 접속 방법

### 방법 1: Supabase 앱 대시보드 사용 (권장)

1. **Supabase 공식 웹사이트 접속**: https://app.supabase.com
2. **로그인** (Google, GitHub, 이메일 등)
3. **프로젝트 목록**에서 프로젝트 선택
   - 프로젝트 이름이나 프로젝트 참조(`sqpplkjxpfeewwtvvdgk`)로 찾기

### 방법 2: 직접 URL 접속

프로젝트 URL 형식:
- ❌ 잘못된 형식: `https://sqpplkjxpfeewwtvvdgk.supabase.co` (대시보드가 아님)
- ✅ 올바른 형식: `https://app.supabase.com/project/sqpplkjxpfeewwtvvdgk`

하지만 일반적으로는 **app.supabase.com**에서 로그인 후 프로젝트를 선택하는 것이 더 안전합니다.

## 데이터베이스 연결 문자열 확인

Supabase 대시보드에 접속한 후:

1. 좌측 메뉴에서 **Settings** (⚙️) 클릭
2. **Database** 탭 클릭
3. **Connection string** 섹션으로 스크롤
4. **URI** 탭 또는 **Connection pooling** 탭 선택
5. 연결 문자열 복사

### 연결 문자열 형식 예시

**직접 연결 (Direct Connection):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**또는:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## .env.local 파일 업데이트

복사한 연결 문자열을 `.env.local` 파일의 `DATABASE_URL`에 붙여넣으세요.

**중요**: `[PASSWORD]` 부분을 실제 비밀번호(`hyun724970!`)로 교체하되, 특수문자는 URL 인코딩:
- `hyun724970!` → `hyun724970%21`

## 문제가 계속되면

1. **Supabase 계정 확인**: 올바른 계정으로 로그인되어 있는지 확인
2. **프로젝트 확인**: 프로젝트가 삭제되지 않았는지 확인
3. **브라우저 캐시**: 브라우저 캐시 삭제 후 다시 시도
4. **시크릿 모드**: 시크릿/프라이빗 모드에서 시도

## 빠른 확인

현재 설정된 Supabase URL 확인:
- `.env.local` 파일의 `NEXT_PUBLIC_SUPABASE_URL` 값
- 이 값은 API 엔드포인트용이지 대시보드 URL이 아닙니다

