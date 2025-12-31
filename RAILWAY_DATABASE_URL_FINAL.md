# Railway DATABASE_URL 최종 설정

## Session Pooler 연결 문자열

Supabase에서 제공한 Session pooler URI를 Railway에 설정하세요.

### Railway Variables 설정

**VARIABLE_NAME**: `DATABASE_URL`

**VALUE**: 
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:hyun724970%21@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

⚠️ **중요**: 
- 비밀번호의 `!`를 `%21`로 URL 인코딩했습니다
- 호스트: `aws-1-ap-southeast-1.pooler.supabase.com`
- 포트: `5432` (Session pooler)
- 사용자명: `postgres.sqpplkjxpfeewwtvvdgk`

### 설정 방법

1. Railway 대시보드 → 프로젝트 → **Variables** 탭
2. `DATABASE_URL` 변수를 찾아서 **Edit** 클릭
3. **VALUE** 필드에 위의 연결 문자열 입력
4. **Save** 클릭

### 확인

- ✅ Session pooler 사용 (IPv4 호환)
- ✅ Railway와 호환
- ✅ 비밀번호 URL 인코딩 완료

환경 변수를 저장하면 Railway가 자동으로 재배포합니다.

