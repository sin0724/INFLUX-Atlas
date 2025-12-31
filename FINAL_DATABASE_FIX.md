# 최종 데이터베이스 연결 오류 해결

## "Tenant or user not found" 오류 - 단계별 해결

이 오류는 **데이터베이스 인증 실패**를 의미합니다. 다음을 순서대로 확인하세요.

### 🔴 1단계: Supabase 프로젝트 상태 확인 (필수!)

1. https://app.supabase.com 접속
2. 프로젝트 `sqpplkjxpfeewwtvvdgk` 선택
3. **프로젝트 상태 확인:**
   - ✅ **Active** (활성) → 다음 단계로
   - ⏸️ **Paused** (일시 중지) → **Resume** 클릭 후 2-3분 대기
   - ❌ **Deleted** (삭제됨) → 새 프로젝트 생성 필요

### 🔴 2단계: Supabase에서 정확한 연결 정보 확인

1. Supabase 대시보드 → **Settings** → **Database**
2. **Database password** 섹션에서:
   - 현재 비밀번호 확인
   - 또는 **Reset database password** 클릭하여 새 비밀번호 생성
3. **Connection string** 섹션에서:
   - **Connection pooling** 탭 선택
   - **URI** 형식 복사
   - 또는 **Direct connection** 탭에서 URI 복사

### 🔴 3단계: Railway Variables 업데이트

Railway → 프로젝트 → **Variables** → `DATABASE_URL` 수정:

**옵션 A: Connection pooling (권장 - 더 안정적)**
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**옵션 B: Direct connection**
```
postgresql://postgres:[PASSWORD]@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres
```

⚠️ **비밀번호 URL 인코딩:**
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

**예시:**
- 비밀번호: `hyun724970!`
- 인코딩: `hyun724970%21`
- 전체 URL: `postgresql://postgres:hyun724970%21@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres`

### 🔴 4단계: Railway 재배포

1. Variables 저장 후 자동 재배포 시작
2. **Deployments** 탭에서 배포 상태 확인
3. 배포 완료까지 대기 (2-3분)

### 🔴 5단계: 연결 테스트

배포 완료 후 브라우저에서:
```
https://your-railway-domain.railway.app/api/debug/db-connection
```

**성공 응답:**
```json
{
  "status": "success",
  "message": "Database connection successful",
  "version": "PostgreSQL ..."
}
```

**실패 응답:**
```json
{
  "status": "error",
  "error": "Tenant or user not found",
  "hint": "Check your DATABASE_URL and Supabase project status"
}
```

### 🔴 6단계: 여전히 안 되면

#### 방법 1: Supabase 프로젝트 재시작
1. Supabase 대시보드 → **Settings** → **General**
2. **Restart project** 클릭
3. 재시작 완료 후 Railway 재배포

#### 방법 2: 새 데이터베이스 비밀번호 생성
1. Supabase 대시보드 → **Settings** → **Database**
2. **Reset database password** 클릭
3. 새 비밀번호 생성
4. Railway Variables에서 `DATABASE_URL` 업데이트 (새 비밀번호로)
5. URL 인코딩 확인

#### 방법 3: Connection pooling 사용
Direct connection이 안 되면 Connection pooling 사용:
1. Supabase 대시보드 → **Settings** → **Database** → **Connection pooling**
2. **URI** 복사
3. Railway `DATABASE_URL`에 붙여넣기

### ✅ 체크리스트

- [ ] Supabase 프로젝트가 **Active** 상태인지 확인
- [ ] Supabase에서 **최신 연결 문자열** 복사
- [ ] Supabase에서 **현재 데이터베이스 비밀번호** 확인
- [ ] Railway `DATABASE_URL`에 **정확한 연결 문자열** 입력
- [ ] 비밀번호 특수문자 **URL 인코딩** 확인
- [ ] `NODE_VERSION=20` 환경 변수 설정 확인
- [ ] Railway 재배포 완료 대기
- [ ] `/api/debug/db-connection` 엔드포인트로 연결 테스트

### 🆘 최후의 수단

위 방법들이 모두 실패하면:

1. **새 Supabase 프로젝트 생성**
2. 새 프로젝트의 연결 정보로 Railway Variables 업데이트
3. `scripts/setup-complete.sql` 실행하여 테이블 생성

---

**가장 중요한 것:** Supabase 프로젝트가 **활성화** 상태여야 합니다!

