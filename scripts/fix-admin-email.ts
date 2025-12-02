import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.')
  process.exit(1)
}

// Service role key를 사용하여 관리자 권한으로 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function fixAdminEmail() {
  console.log('관리자 이메일 수정 중...')

  try {
    // 기존 사용자 찾기
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }
    
    // admin@example.com 또는 admin@local 찾기
    const user = usersList.users.find(u => 
      u.email === 'admin@example.com' || 
      u.email === 'admin@local' ||
      u.email?.includes('admin')
    )
    
    if (!user) {
      console.log('사용자를 찾을 수 없습니다.')
      return
    }

    console.log('사용자 발견:', user.email)
    
    // 이메일을 admin@local로 변경
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { email: 'admin@local' }
    )

    if (error) {
      throw error
    }

    console.log('✅ 이메일 수정 완료!')
    console.log('새 이메일: admin@local')
    console.log('아이디: admin')
    console.log('비밀번호: 123456')
    console.log('\n이제 로그인할 수 있습니다!')

  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message)
    if (error.details) {
      console.error('상세:', error.details)
    }
    process.exit(1)
  }
}

fixAdminEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

