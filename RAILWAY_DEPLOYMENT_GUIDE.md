# Railway 배포 가이드

INFLUX Atlas 애플리케이션을 Railway에 배포하는 방법입니다.

## 사전 준비

1. **Git 저장소 준비**
   - GitHub, GitLab, 또는 Bitbucket에 프로젝트를 푸시합니다.

2. **환경 변수 확인**
   - 다음 환경 변수들이 필요합니다:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `DATABASE_URL`

## Railway 배포 단계

### 1. Railway 계정 생성
1. [Railway](https://railway.app)에 접속하여 계정을 생성합니다.
2. GitHub 계정과 연동합니다.

### 2. 새 프로젝트 생성
1. Railway 대시보드에서 **"New Project"** 클릭
2. **"Deploy from GitHub repo"** 선택
3. Git 저장소를 선택합니다.

### 3. 프로젝트 설정
Railway가 자동으로 Next.js 프로젝트를 감지합니다.

**자동 설정:**
- Build Command: `npm run build`
- Start Command: `npm start`
- Node.js 버전: 자동 감지

### 4. 환경 변수 설정
프로젝트 → **Variables** 탭에서 다음 변수들을 하나씩 추가합니다:

**1번째 변수:**
- **VARIABLE_NAME**: `NEXT_PUBLIC_SUPABASE_URL`
- **VALUE**: `https://sqpplkjxpfeewwtvvdgk.supabase.co`

**2번째 변수:**
- **VARIABLE_NAME**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **VALUE**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcHBsa2p4cGZlZXd3dHZ2ZGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzMwOTIsImV4cCI6MjA4MDI0OTA5Mn0.VijiYcJvPn7TQhgcxyhTMQg1nZYBatHPaCcB6n3aBFc`

**3번째 변수:**
- **VARIABLE_NAME**: `SUPABASE_SERVICE_ROLE_KEY`
- **VALUE**: `sb_secret_B-EGhskmwTsBkEeVhbMVWQ_YC85V7UD`

**4번째 변수:**
- **VARIABLE_NAME**: `DATABASE_URL`
- **VALUE**: `postgresql://postgres.sqpplkjxpfeewwtvvdgk:hyun724970%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
  - ⚠️ 비밀번호의 특수문자 `!`는 `%21`로 URL 인코딩되어 있습니다.

⚠️ **중요**: 
- 각 변수를 추가한 후 **"Add"** 버튼을 클릭합니다.
- Railway는 환경 변수를 추가하면 자동으로 재배포됩니다.
- Supabase 대시보드에서 최신 키 값을 확인하여 업데이트하세요.

### 5. 배포 확인
1. **Deployments** 탭에서 배포 상태 확인
2. 배포 완료 후 제공된 URL로 접속
3. 로그인 페이지가 정상적으로 표시되는지 확인

### 6. 커스텀 도메인 설정 (선택사항)
1. 프로젝트 → **Settings** → **Domains**
2. **"Generate Domain"** 클릭하여 Railway 도메인 생성
3. 또는 **"Custom Domain"**에서 자신의 도메인 추가

## Railway 설정 파일

프로젝트 루트에 `railway.json` 파일이 있으면 Railway가 이를 사용합니다. (선택사항)

## 배포 후 확인 사항

### 필수 확인
- [ ] 로그인 페이지 접속 가능
- [ ] 관리자 계정 로그인 성공
- [ ] 대시보드 데이터 표시 확인
- [ ] 인플루언서 목록 조회 가능
- [ ] 데이터 임포트 기능 작동 확인

### 문제 해결

#### 데이터베이스 연결 오류
- Supabase 프로젝트가 활성화되어 있는지 확인
- `DATABASE_URL`이 정확한지 확인 (Connection pooling URI 사용 권장)
- Railway 로그에서 연결 오류 확인

#### 인증 오류
- `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- Supabase Auth 설정 확인
- Railway 환경 변수가 올바르게 설정되었는지 확인

#### 빌드 오류
- Railway 로그에서 오류 메시지 확인
- 로컬에서 `npm run build` 성공 여부 확인
- Node.js 버전 확인 (Railway는 자동으로 감지하지만 필요시 명시 가능)

#### 포트 설정
- Railway는 자동으로 `PORT` 환경 변수를 설정합니다.
- Next.js는 기본적으로 `PORT` 환경 변수를 사용합니다.

## 자동 배포 설정

기본적으로 Git 저장소의 `main` 또는 `master` 브랜치에 푸시하면 자동으로 재배포됩니다.

### 브랜치별 배포
- Railway는 기본적으로 기본 브랜치만 배포합니다.
- 다른 브랜치를 배포하려면 프로젝트 설정에서 추가 가능합니다.

## 모니터링 및 로그

- **Logs**: Railway 대시보드에서 실시간 로그 확인
- **Metrics**: CPU, 메모리 사용량 모니터링
- **Deployments**: 배포 이력 및 상태 확인

## 비용 관리

- Railway는 무료 티어를 제공합니다 ($5 크레딧/월)
- 사용량에 따라 과금됩니다.
- 프로젝트 → **Settings** → **Usage**에서 사용량 확인

## 환경 변수 관리

### 프로덕션 환경 변수
- 프로젝트 → **Variables** 탭에서 설정
- 환경 변수를 변경하면 자동으로 재배포됩니다.

### 환경 변수 업데이트
1. **Variables** 탭에서 변수 추가/수정
2. Railway가 자동으로 재배포 시작
3. 배포 완료 후 변경사항 적용

## 추가 리소스

- [Railway 공식 문서](https://docs.railway.app)
- [Railway Next.js 가이드](https://docs.railway.app/guides/nextjs)
- [Supabase 문서](https://supabase.com/docs)

## Railway vs Vercel

### Railway 장점
- 더 유연한 설정 가능
- 데이터베이스 서비스 통합 제공
- Docker 지원
- 더 많은 제어권

### 주의사항
- Vercel보다 설정이 약간 더 복잡할 수 있음
- Next.js 최적화는 Vercel이 더 특화되어 있음

