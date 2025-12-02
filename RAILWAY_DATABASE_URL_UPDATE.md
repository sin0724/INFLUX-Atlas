# Railway DATABASE_URL 업데이트

## 직접 연결 문자열 사용

Supabase에서 제공한 직접 연결 문자열을 Railway에 설정하세요.

### Railway Variables 설정

**VARIABLE_NAME**: `DATABASE_URL`

**VALUE**: 
```
postgresql://postgres:hyun724970%21@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres
```

⚠️ **중요**: 비밀번호의 `!`를 `%21`로 URL 인코딩했습니다.

### 설정 방법

1. Railway 대시보드 → 프로젝트 → **Variables** 탭
2. `DATABASE_URL` 변수를 찾아서 **Edit** 클릭
3. **VALUE** 필드에 위의 연결 문자열 입력
4. **Save** 클릭

또는 새로 추가:
1. **New Variable** 클릭
2. **VARIABLE_NAME**: `DATABASE_URL`
3. **VALUE**: `postgresql://postgres:hyun724970%21@db.sqpplkjxpfeewwtvvdgk.supabase.co:5432/postgres`
4. **Add** 클릭

### 참고

- 직접 연결은 Connection pooling보다 덜 안정적일 수 있습니다
- 연결 문제가 계속되면 Connection pooling URI 사용을 권장합니다
- Connection pooling URI는 Supabase 대시보드 → Settings → Database → Connection pooling에서 확인 가능

