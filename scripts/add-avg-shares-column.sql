-- 평균 공유수 컬럼 추가
ALTER TABLE influencers 
ADD COLUMN IF NOT EXISTS avg_shares INTEGER;

-- 컬럼이 추가되었는지 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'influencers' 
AND column_name = 'avg_shares';

