# Railway IPv4 호환성 문제 해결

## 문제: "Not IPv4 compatible" 경고

Supabase Direct connection은 IPv4와 호환되지 않습니다. Railway는 IPv4 네트워크를 사용하므로 **Connection pooling (Session Pooler)**을 사용해야 합니다.

## 해결 방법

### 1. Supabase 대시보드에서 Connection Pooling URI 가져오기

1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection string** 섹션에서:
   - **Method** 드롭다운을 **"Connection pooling"** 또는 **"Session mode"**로 변경
   - 또는 **"Pooler settings"** 버튼 클릭
3. **URI** 형식의 연결 문자열 복사

### 2. Railway Variables 업데이트

Railway → 프로젝트 → **Variables** → `DATABASE_URL`:

**Connection pooling URI 형식:**
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

⚠️ **비밀번호 URL 인코딩:**
- `!` → `%21`
- 예: `hyun724970!` → `hyun724970%21`

**최종 값:**
```
postgresql://postgres.sqpplkjxpfeewwtvvdgk:hyun724970%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

### 3. Connection Pooling vs Direct Connection

| 항목 | Direct Connection | Connection Pooling |
|------|------------------|---------------------|
| 포트 | 5432 | 6543 (Session) 또는 5432 (Transaction) |
| 호스트 | `db.xxx.supabase.co` | `aws-0-xxx.pooler.supabase.com` |
| 사용자명 | `postgres` | `postgres.xxx` (프로젝트 참조 포함) |
| IPv4 호환 | ❌ | ✅ |
| Railway 호환 | ❌ | ✅ |

### 4. Supabase에서 정확한 Pooling URI 확인

1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection string** 섹션
3. **Method**를 **"Connection pooling"** 또는 **"Session mode"**로 변경
4. **URI** 복사
5. Railway `DATABASE_URL`에 붙여넣기

### 5. 재배포

환경 변수 수정 후 Railway가 자동으로 재배포합니다.

---

**핵심:** Railway는 IPv4 네트워크이므로 **Connection pooling**을 반드시 사용해야 합니다!

