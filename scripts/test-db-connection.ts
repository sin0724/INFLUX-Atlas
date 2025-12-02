import { config } from 'dotenv'
import { resolve } from 'path'
import postgres from 'postgres'

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL이 설정되지 않았습니다.')
  process.exit(1)
}

console.log('연결 문자열 테스트 중...')
console.log('호스트:', connectionString.match(/@([^:]+)/)?.[1])

async function testConnection() {
  try {
    if (!connectionString) {
      console.error('DATABASE_URL이 설정되지 않았습니다.')
      process.exit(1)
    }
    const client = postgres(connectionString, {
      max: 1,
      connect_timeout: 10,
    })
    
    const result = await client`SELECT version()`
    console.log('✅ 데이터베이스 연결 성공!')
    console.log('PostgreSQL 버전:', result[0].version)
    
    await client.end()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ 연결 실패:', error.message)
    console.error('\n가능한 해결 방법:')
    console.error('1. Supabase 대시보드 > Settings > Database에서 정확한 연결 문자열 확인')
    console.error('2. Connection pooling 연결 문자열 사용 시도')
    console.error('3. 네트워크 연결 확인')
    process.exit(1)
  }
}

testConnection()

