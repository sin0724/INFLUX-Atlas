import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { LogoutButton } from '@/components/logout-button'

export async function Navbar() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            INFLUX Atlas
          </Link>
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-primary"
            >
              대시보드
            </Link>
            <Link
              href="/influencers"
              className="text-sm font-medium text-gray-700 hover:text-primary"
            >
              인플루언서
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/import"
                className="text-sm font-medium text-gray-700 hover:text-primary"
              >
                데이터 임포트
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{user.username || user.name} ({user.role === 'admin' ? '관리자' : '직원'})</span>
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}

