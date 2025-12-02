# 데이터베이스 연결 문제 해결

## 현재 문제
`getaddrinfo ENOTFOUND db.sqpplkjxpfeewwtvvdgk.supabase.co` 오류

## 가능한 원인

### 1. Supabase 프로젝트 상태 확인
- Supabase 대시보드에서 프로젝트가 **일시 중지(paused)** 상태일 수 있습니다
- 프로젝트가 **삭제**되었을 수 있습니다
- **Settings** > **General**에서 프로젝트 상태 확인

### 2. 연결 풀링 사용 시도

Supabase 대시보드에서:
1. **Settings** > **Database** 이동
2. **Connection string** 섹션
3. **Connection pooling** 탭 선택 (URI가 아닌)
4. 연결 문자열 복사 (형식이 다를 수 있음)

연결 풀링 형식 예시:
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 3. 프로젝트 재시작

Supabase 대시보드에서:
- 프로젝트가 일시 중지 상태라면 **Resume** 클릭
- 또는 프로젝트를 재시작

### 4. 네트워크 확인

터미널에서 호스트 연결 테스트:
```bash
ping db.sqpplkjxpfeewwtvvdgk.supabase.co
```

또는:
```bash
nslookup db.sqpplkjxpfeewwtvvdgk.supabase.co
```

## 다음 단계

1. **Supabase 대시보드에서 프로젝트 상태 확인**
2. **Connection pooling 연결 문자열 시도**
3. **프로젝트가 일시 중지 상태라면 재시작**

## 임시 해결책

만약 데이터베이스 연결이 계속 안 된다면:
- Supabase 대시보드 > **Settings** > **Database** > **Connection string**에서
- **Session mode** 또는 **Transaction mode** 연결 문자열도 시도해보세요

