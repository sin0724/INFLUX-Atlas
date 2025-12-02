import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음')
  process.exit(1)
}

// Service role key를 사용하여 관리자 권한으로 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdminUser() {
  console.log('관리자 사용자 생성 중...')

  try {
    let userId: string

    // 먼저 기존 사용자 확인
    console.log('기존 사용자 확인 중...')
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }
    
    const username = 'admin'
    const email = `${username}@local`
    
    const existingUser = usersList.users.find(u => u.email === email || u.email === 'admin@example.com' || u.email === 'admin@local')

    if (existingUser) {
      console.log('✅ 기존 사용자 발견')
      userId = existingUser.id
      console.log('사용자 ID:', userId)
    } else {
      // 사용자 생성
      console.log('새 사용자 생성 중...')
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: '123456',
        email_confirm: true,
      })

      if (authError) {
        throw authError
      }

      console.log('✅ Supabase Auth에 사용자 생성 완료')
      userId = authData.user!.id
      console.log('사용자 ID:', userId)
    }

    // 2. 데이터베이스의 users 테이블에 레코드 추가
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        username: username,
        email: email,
        name: 'Admin',
        role: 'admin',
      }, {
        onConflict: 'id'
      })
      .select()

    if (dbError) {
      throw dbError
    }

    console.log('✅ 데이터베이스에 사용자 레코드 추가 완료')
    console.log('생성된 사용자:', dbData)

    console.log('\n🎉 관리자 계정 생성 완료!')
    console.log('아이디: admin')
    console.log('비밀번호: 123456')
    console.log('역할: admin')

  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message)
    if (error.details) {
      console.error('상세:', error.details)
    }
    process.exit(1)
  }
}

createAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

