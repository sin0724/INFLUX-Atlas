# 긴급: 데이터베이스 연결 오류 해결

## "Tenant or user not found" 오류 해결

이 오류는 데이터베이스 인증 실패를 의미합니다. 다음을 순서대로 확인하세요.

### 1. Supabase 프로젝트 상태 확인 (가장 중요!)

1. https://app.supabase.com 접속
2. 프로젝트 `sqpplkjxpfeewwtvvdgk` 선택
3. 프로젝트가 **일시 중지(Paused)** 상태인지 확인
4. 일시 중지 상태라면 **Resume** 버튼 클릭
5. 프로젝트가 완전히 활성화될 때까지 대기 (1-2분)

### 2. Supabase에서 정확한 연결 문자열 확인

**방법 1: Connection pooling (권장)**
1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection pooling** 탭 클릭
3. **Connection string** → **URI** 복사
4. 형식: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

**방법 2: Direct connection**
1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection string** → **URI** 복사
3. 형식: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

### 3. Railway Variables 업데이트

Railway → 프로젝트 → **Variables** → `DATABASE_URL` 수정:

**옵션 A: Connection pooling 사용 (권장)**
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:hyun724970%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**옵션 B: Direct connection 사용**
```
postgresql://postgres:hyun724970%21@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres
```

⚠️ **비밀번호 URL 인코딩**: `!` → `%21`

### 4. Supabase 비밀번호 재확인

1. Supabase 대시보드 → **Settings** → **Database**
2. **Database password** 섹션에서 비밀번호 확인
3. 비밀번호가 변경되었다면 Railway의 `DATABASE_URL`도 업데이트

### 5. Railway 재배포

환경 변수 수정 후:
1. Railway가 자동으로 재배포 시작
2. 배포 완료까지 대기 (2-3분)
3. 로그에서 연결 성공 여부 확인

### 6. 빠른 체크리스트

- [ ] Supabase 프로젝트가 **활성화** 상태인지 확인
- [ ] Supabase 대시보드에서 **최신 연결 문자열** 복사
- [ ] Railway `DATABASE_URL`에 **정확한 연결 문자열** 입력
- [ ] 비밀번호 특수문자 **URL 인코딩** 확인 (`!` → `%21`)
- [ ] `NODE_VERSION=20` 환경 변수 설정 확인
- [ ] Railway 재배포 완료 대기

### 7. 여전히 안 되면

1. **Supabase 프로젝트 재시작**
   - Settings → General → Restart project

2. **새로운 데이터베이스 비밀번호 생성**
   - Settings → Database → Reset database password
   - 새 비밀번호로 Railway `DATABASE_URL` 업데이트

3. **Connection pooling URI 사용**
   - Direct connection보다 안정적
   - Supabase 대시보드에서 Connection pooling URI 복사

### 8. 연결 테스트

Railway 로그에서 다음 메시지를 확인:
- ✅ `Connected to database` → 성공
- ❌ `Tenant or user not found` → 인증 실패 (비밀번호 확인)
- ❌ `Connection refused` → 프로젝트 비활성화 또는 네트워크 문제

