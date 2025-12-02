# Git 저장소 푸시 명령어

## Windows PowerShell에서 실행

### 1. 프로젝트 폴더로 이동
```powershell
cd "C:\Users\ADMIN\Desktop\INFLUX Atlas"
```

### 2. Git 상태 확인
```powershell
git status
```

### 3. 변경사항 추가
```powershell
git add .
```

### 4. 커밋 생성
```powershell
git commit -m "Railway 배포 준비 완료"
```

### 5. 원격 저장소에 푸시
```powershell
git push origin main
```

또는 master 브랜치를 사용하는 경우:
```powershell
git push origin master
```

## 전체 명령어 (한 번에 복사)

```powershell
cd "C:\Users\ADMIN\Desktop\INFLUX Atlas"
git add .
git commit -m "Railway 배포 준비 완료"
git push origin main
```

## Git 저장소가 없는 경우

처음 Git 저장소를 초기화하는 경우:

```powershell
cd "C:\Users\ADMIN\Desktop\INFLUX Atlas"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

⚠️ **주의**: `your-username`과 `your-repo`를 실제 GitHub 사용자명과 저장소명으로 변경하세요.

## 문제 해결

### 인증 오류가 발생하는 경우
- GitHub Personal Access Token 사용 필요
- 또는 SSH 키 설정

### 브랜치 이름 확인
```powershell
git branch
```

