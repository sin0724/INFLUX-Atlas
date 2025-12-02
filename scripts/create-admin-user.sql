-- 이 스크립트는 Supabase SQL Editor에서 실행하세요
-- Supabase Auth에서 사용자를 먼저 생성한 후 사용자의 UUID를 사용하세요

-- 1. Supabase Auth에서 사용자 생성:
--    - Authentication > Users > Add user
--    - 이메일: admin@example.com
--    - 비밀번호: (원하는 비밀번호)
--    - 생성된 UUID 복사

-- 2. 아래 SQL 실행 (UUID를 실제 값으로 교체):
INSERT INTO users (id, email, name, role, created_at, updated_at)
VALUES (
  '여기에-사용자-UUID-입력',  -- Supabase Auth에서 생성된 사용자 ID
  'admin@example.com',
  'Admin User',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 확인
SELECT id, email, name, role FROM users;

