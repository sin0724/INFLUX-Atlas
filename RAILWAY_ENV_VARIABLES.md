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

**옵션 A: Connection pooling (권장)**
```
VARIABLE_NAME: DATABASE_URL
VALUE: postgresql://postgres.sqpplkjxpfeewwtvvdgk:hyun724970%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**옵션 B: Direct connection**
```
VARIABLE_NAME: DATABASE_URL
VALUE: postgresql://postgres:hyun724970%21@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres
```

⚠️ **중요**: 
- Supabase 대시보드에서 최신 연결 문자열을 확인하세요
- 비밀번호가 변경되었다면 Railway에서도 업데이트하세요
- Connection pooling이 더 안정적입니다

⚠️ **주의사항:**
- `DATABASE_URL`의 비밀번호에 특수문자(`!`)가 있으면 URL 인코딩이 필요합니다.
- `!` → `%21`
- Supabase 대시보드 > Settings > Database > Connection pooling에서 최신 연결 문자열을 확인하세요.

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

