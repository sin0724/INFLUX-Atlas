-- 기존 users 테이블에 username 컬럼 추가
-- 테이블이 이미 생성되어 있다면 이 스크립트를 실행하세요

-- username 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

-- 기존 데이터에 username 값 채우기 (이메일에서 추출)
UPDATE users 
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL;

-- UNIQUE 제약 조건 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- NOT NULL 제약 조건 추가
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- 확인
SELECT id, username, email, name, role FROM users;

