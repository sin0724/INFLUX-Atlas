# Railway 데이터베이스 연결 오류 해결

## 오류: "Tenant or user not found"

이 오류는 데이터베이스 연결 인증 문제입니다.

### 해결 방법

#### 1. Node.js 버전 업그레이드
Railway 대시보드 → 프로젝트 → **Variables** → 다음 변수 추가:
- **VARIABLE_NAME**: `NODE_VERSION`
- **VALUE**: `20`

또는 Railway 설정에서 Node.js 버전을 20으로 설정

#### 2. DATABASE_URL 확인 및 수정

**Supabase 대시보드에서 정확한 연결 문자열 확인:**

1. Supabase 대시보드 접속: https://app.supabase.com
2. 프로젝트 선택
3. **Settings** → **Database** 이동
4. **Connection pooling** 탭 선택
5. **Connection string** → **URI** 복사

**Railway Variables에서 DATABASE_URL 업데이트:**

- **VARIABLE_NAME**: `DATABASE_URL`
- **VALUE**: Supabase에서 복사한 정확한 연결 문자열

**연결 문자열 형식:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**중요:**
- 비밀번호에 특수문자(`!`, `@`, `#` 등)가 있으면 URL 인코딩 필요
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`

#### 3. Supabase 프로젝트 상태 확인

1. Supabase 대시보드에서 프로젝트가 **활성화**되어 있는지 확인
2. 프로젝트가 일시 중지되었다면 **Resume** 클릭

#### 4. 연결 문자열 예시

올바른 형식:
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:hyun724970%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

잘못된 형식:
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:hyun724970!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```
(특수문자 `!`가 URL 인코딩되지 않음)

#### 5. Railway 재배포

환경 변수를 수정한 후:
1. Railway가 자동으로 재배포 시작
2. 또는 **Deployments** → **Redeploy** 클릭

#### 6. 확인 체크리스트

- [ ] `NODE_VERSION=20` 환경 변수 설정
- [ ] `DATABASE_URL`이 Supabase Connection pooling URI 형식인지 확인
- [ ] 비밀번호 특수문자 URL 인코딩 확인
- [ ] Supabase 프로젝트가 활성화 상태인지 확인
- [ ] Railway 재배포 완료 대기

### 빠른 수정 명령어 (Railway CLI 사용 시)

```bash
railway variables set NODE_VERSION=20
railway variables set DATABASE_URL="postgresql://postgres.sqpplkjxpfeewwtvvdgk:hyun724970%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

### 여전히 해결되지 않는 경우

1. Supabase 대시보드에서 **새로운 연결 문자열 생성**
2. Railway Variables에서 `DATABASE_URL` 완전히 삭제 후 재추가
3. Railway 로그에서 더 자세한 오류 메시지 확인

