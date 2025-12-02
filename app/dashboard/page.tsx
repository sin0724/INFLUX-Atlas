import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { influencers } from '@/lib/db/schema'
import { count, sql, desc, gte } from 'drizzle-orm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardPageProps {
  searchParams: { page?: string }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const page = parseInt(searchParams.page || '1', 10)
  const pageSize = 10
  const offset = (page - 1) * pageSize

  try {
    // Get KPIs
    const [totalCount] = await db.select({ count: count() }).from(influencers)
  
  const platformCounts = await db
    .select({
      platform: influencers.platform,
      count: count(),
    })
    .from(influencers)
    .groupBy(influencers.platform)

  const categoryCounts = await db
    .select({
      category: influencers.mainCategory,
      count: count(),
    })
    .from(influencers)
    .where(sql`${influencers.mainCategory} IS NOT NULL`)
    .groupBy(influencers.mainCategory)
    .orderBy(desc(count()))
    .limit(3)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const [recentCount] = await db
    .select({ count: count() })
    .from(influencers)
    .where(gte(influencers.createdAt, thirtyDaysAgo))

  // Get latest influencers with pagination
  const [latestInfluencers, totalInfluencers] = await Promise.all([
    db
      .select()
      .from(influencers)
      .orderBy(desc(influencers.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(influencers)
  ])

    const totalPages = Math.ceil(totalInfluencers[0].count / pageSize)

    return (
      <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">대시보드</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>전체 인플루언서</CardDescription>
              <CardTitle className="text-3xl">{totalCount.count}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>플랫폼</CardDescription>
              <CardTitle className="text-2xl">
                {platformCounts.length}개 활성
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {platformCounts.map((p) => (
                  <div key={p.platform} className="flex justify-between text-sm">
                    <span className="capitalize">{p.platform}</span>
                    <span className="font-medium">{p.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>인기 카테고리</CardDescription>
              <CardTitle className="text-2xl">상위 3개</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {categoryCounts.map((c) => (
                  <div key={c.category} className="flex justify-between text-sm">
                    <span>{c.category || '미분류'}</span>
                    <span className="font-medium">{c.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>신규 (최근 30일)</CardDescription>
              <CardTitle className="text-3xl">{recentCount.count}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Latest Influencers */}
        <Card>
          <CardHeader>
            <CardTitle>최근 등록된 인플루언서</CardTitle>
            <CardDescription>가장 최근에 추가된 인플루언서</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>플랫폼</TableHead>
                  <TableHead>팔로워</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestInfluencers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      등록된 인플루언서가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  latestInfluencers.map((influencer) => (
                    <TableRow key={influencer.id}>
                      <TableCell className="font-medium">{influencer.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {influencer.platform}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {influencer.followers
                          ? influencer.followers.toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            influencer.status === 'active'
                              ? 'default'
                              : influencer.status === 'blacklist'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          {influencer.status === 'active' ? '활성' : influencer.status === 'blacklist' ? '블랙리스트' : '후보'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(influencer.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {offset + 1} - {Math.min(offset + pageSize, totalInfluencers[0].count)} / 총 {totalInfluencers[0].count}개
                </div>
                <div className="flex items-center space-x-2">
                  {page > 1 ? (
                    <Link href={`/dashboard?page=1`}>
                      <Button variant="outline" size="sm">
                        처음
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      처음
                    </Button>
                  )}
                  {page > 1 ? (
                    <Link href={`/dashboard?page=${page - 1}`}>
                      <Button variant="outline" size="sm">
                        <ChevronLeft className="h-4 w-4" />
                        이전
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link href={`/dashboard?page=${page + 1}`}>
                      <Button variant="outline" size="sm">
                        다음
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                  {page < totalPages ? (
                    <Link href={`/dashboard?page=${totalPages}`}>
                      <Button variant="outline" size="sm">
                        마지막
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      마지막
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isDbError = errorMessage.includes('Tenant or user not found') || errorMessage.includes('DATABASE_URL')
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">데이터베이스 연결 오류</h2>
            {isDbError ? (
              <>
                <p className="text-red-600 mb-4">데이터베이스 연결에 실패했습니다.</p>
                <div className="bg-white rounded p-4 mb-4">
                  <h3 className="font-semibold mb-2">확인 사항:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Supabase 프로젝트가 활성화 상태인지 확인</li>
                    <li>Railway Variables에서 DATABASE_URL이 올바르게 설정되었는지 확인</li>
                    <li>비밀번호 특수문자가 URL 인코딩되었는지 확인 (예: ! → %21)</li>
                    <li>Supabase 대시보드에서 최신 연결 문자열 확인</li>
                  </ul>
                </div>
                <p className="text-sm text-red-500 mt-2">
                  <strong>오류:</strong> {errorMessage}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  연결 테스트: <code>/api/debug/db-connection</code>
                </p>
              </>
            ) : (
              <>
                <p className="text-red-600">데이터를 불러오는 중 오류가 발생했습니다.</p>
                <p className="text-sm text-red-500 mt-2">오류: {errorMessage}</p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }
}

