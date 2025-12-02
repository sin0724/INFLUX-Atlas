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

async function resetAdminPassword() {
  console.log('관리자 비밀번호 재설정 중...')

  try {
    const email = 'admin@local'
    
    // 사용자 찾기
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }
    
    const user = usersList.users.find(u => u.email === email || u.email === 'admin@example.com' || u.email === 'admin@local')
    
    if (!user) {
      console.log('사용자를 찾을 수 없습니다. 새로 생성합니다...')
      // 새 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: '123456',
        email_confirm: true,
      })

      if (authError) {
        throw authError
      }

      console.log('✅ 새 사용자 생성 완료')
      console.log('사용자 ID:', authData.user!.id)
      console.log('이메일:', email)
      console.log('비밀번호: 123456')
      return
    }

    console.log('사용자 발견:', user.email)
    
    // 비밀번호 재설정
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: '123456' }
    )

    if (error) {
      throw error
    }

    console.log('✅ 비밀번호 재설정 완료!')
    console.log('이메일:', email)
    console.log('비밀번호: 123456')
    console.log('아이디: admin')
    console.log('\n이제 로그인할 수 있습니다!')

  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message)
    if (error.details) {
      console.error('상세:', error.details)
    }
    process.exit(1)
  }
}

resetAdminPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

