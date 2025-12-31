# Railway 환경 변수 설정 가이드

Railway 대시보드에서 환경 변수를 설정할 때 아래 형식으로 입력하세요.

## 환경 변수 목록

### 1. NEXT_PUBLIC_SUPABASE_URL
```
VARIABLE_NAME: NEXT_PUBLIC_SUPABASE_URL
VALUE: https://sqpplkjxpfeewwtvvdgk.supabase.co
```

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
VARIABLE_NAME: NEXT_PUBLIC_SUPABASE_ANON_KEY
VALUE: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcHBsa2p4cGZlZXd3dHZ2ZGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzMwOTIsImV4cCI6MjA4MDI0OTA5Mn0.VijiYcJvPn7TQhgcxyhTMQg1nZYBatHPaCcB6n3aBFc
```

### 3. SUPABASE_SERVICE_ROLE_KEY
```
VARIABLE_NAME: SUPABASE_SERVICE_ROLE_KEY
VALUE: sb_secret_B-EGhskmwTsBkEeVhbMVWQ_YC85V7UD
```

### 4. DATABASE_URL

⚠️ **중요: Railway는 IPv4 네트워크이므로 Session pooler를 반드시 사용해야 합니다!**

**Session pooler 사용 (필수):**

**VARIABLE_NAME**: `DATABASE_URL`

**VALUE**: 
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:hyun724970%21@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

⚠️ **비밀번호 URL 인코딩**: `!` → `%21`

**Session pooler 특징:**
- 호스트: `aws-1-ap-southeast-1.pooler.supabase.com`
- 포트: `5432`
- 사용자명: `postgres.sqpplkjxpfeewwtvvdgk`
- ✅ IPv4 호환
- ✅ Railway 호환

**Connection pooling 특징:**
- 포트: `6543` (Session mode) 또는 `5432` (Transaction mode)
- 호스트: `aws-0-[REGION].pooler.supabase.com`
- 사용자명: `postgres.[PROJECT_REF]`
- ✅ IPv4 호환
- ✅ Railway 호환

**Direct connection은 사용하지 마세요!**
- ❌ IPv4 비호환
- ❌ Railway에서 연결 실패

⚠️ **중요한 주의사항:**

1. **Supabase 프로젝트 상태 확인 (가장 중요!)**
   - 프로젝트가 **Active** 상태여야 합니다
   - **Paused** 상태라면 **Resume** 클릭

2. **비밀번호 URL 인코딩**
   - 특수문자가 있으면 반드시 URL 인코딩 필요
   - `!` → `%21`
   - `@` → `%40`
   - `#` → `%23`

3. **최신 연결 문자열 사용**
   - Supabase 대시보드 > Settings > Database에서 최신 연결 문자열 확인
   - 비밀번호가 변경되었다면 Railway에서도 업데이트

4. **Connection pooling 권장**
   - Direct connection보다 안정적
   - Supabase 대시보드에서 Connection pooling URI 사용

## 설정 방법

1. Railway 프로젝트 → **Variables** 탭 클릭
2. **"New Variable"** 버튼 클릭
3. **VARIABLE_NAME** 필드에 변수명 입력
4. **VALUE** 필드에 값 입력
5. **"Add"** 버튼 클릭
6. 모든 변수를 위 순서대로 추가

## 확인 방법

모든 변수가 추가되면:
- Variables 목록에 4개의 변수가 표시되어야 합니다
- 각 변수 옆에 값이 마스킹되어 표시됩니다
- Railway가 자동으로 재배포를 시작합니다

