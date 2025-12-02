# Railway 배포 오류 해결 가이드

## "Application error: a server-side exception has occurred" 오류

이 오류는 서버 측에서 예외가 발생했을 때 나타납니다. 다음을 확인하세요:

### 1. 환경 변수 확인

Railway 대시보드 → 프로젝트 → **Variables** 탭에서 다음 변수들이 모두 설정되어 있는지 확인:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `DATABASE_URL`

**확인 방법:**
- Variables 목록에 4개가 모두 있어야 합니다
- 값이 비어있지 않은지 확인

### 2. Railway 로그 확인

Railway 대시보드 → 프로젝트 → **Deployments** → 최신 배포 → **View Logs**

로그에서 다음을 확인:
- 환경 변수 로드 오류
- 데이터베이스 연결 오류
- Supabase 인증 오류
- 구체적인 에러 메시지

### 3. 일반적인 문제 해결

#### 문제 1: DATABASE_URL 오류
```
Error: DATABASE_URL is not set
```
**해결:**
- Railway Variables에 `DATABASE_URL` 추가
- Supabase 대시보드에서 최신 연결 문자열 확인
- 비밀번호 특수문자 URL 인코딩 확인 (`!` → `%21`)

#### 문제 2: Supabase 환경 변수 오류
```
Error: Missing Supabase environment variables
```
**해결:**
- `NEXT_PUBLIC_SUPABASE_URL` 확인
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- Supabase 대시보드에서 최신 키 값 확인

#### 문제 3: 데이터베이스 연결 실패
```
Error: getaddrinfo ENOTFOUND
```
**해결:**
- Supabase 프로젝트가 활성화되어 있는지 확인
- Connection pooling URI 사용 확인
- 네트워크 방화벽 설정 확인

#### 문제 4: 사용자 테이블 오류
```
Error: column "username" does not exist
```
**해결:**
- Supabase SQL Editor에서 `scripts/setup-complete.sql` 실행
- 또는 `scripts/add-username-column.sql` 실행

### 4. 재배포

환경 변수를 수정한 후:
1. Railway가 자동으로 재배포 시작
2. 또는 **Deployments** → **Redeploy** 클릭

### 5. 로그 확인 명령어

Railway CLI를 사용하는 경우:
```bash
railway logs
```

또는 Railway 대시보드에서:
- **Deployments** → 최신 배포 → **View Logs**

### 6. 디버깅 팁

1. **환경 변수 확인 페이지 생성** (임시)
   - `/api/debug/env` 엔드포인트 생성하여 환경 변수 확인
   - 배포 후 삭제

2. **단계별 확인**
   - 로그인 페이지 접속 가능?
   - 로그인 성공?
   - 대시보드 접속 시 오류?

3. **데이터베이스 직접 확인**
   - Supabase 대시보드 → Table Editor
   - `users` 테이블에 관리자 계정이 있는지 확인

### 7. 빠른 해결 체크리스트

- [ ] Railway Variables에 4개 환경 변수 모두 설정
- [ ] `DATABASE_URL` 비밀번호 URL 인코딩 확인
- [ ] Supabase 프로젝트 활성화 상태 확인
- [ ] Railway 로그에서 구체적인 오류 메시지 확인
- [ ] Supabase 대시보드에서 최신 키 값 확인
- [ ] 데이터베이스 테이블 생성 확인 (`setup-complete.sql` 실행)

### 8. 여전히 해결되지 않는 경우

Railway 로그의 전체 에러 메시지를 복사하여 확인하세요. 일반적으로:
- 환경 변수 누락
- 데이터베이스 연결 실패
- 테이블/컬럼 누락
- Supabase 인증 설정 문제

로그의 정확한 에러 메시지를 알려주시면 더 구체적인 해결책을 제시할 수 있습니다.

