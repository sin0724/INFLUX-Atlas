import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getInfluencers } from '@/lib/repositories/influencers'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams

    // Parse filters (same as GET /api/influencers)
    const filters = {
      search: searchParams.get('search') || undefined,
      platforms: searchParams.get('platforms')?.split(',').filter(Boolean),
      countries: searchParams.get('countries')?.split(',').filter(Boolean),
      cities: searchParams.get('cities')?.split(',').filter(Boolean),
      followersMin: searchParams.get('followersMin')
        ? parseInt(searchParams.get('followersMin')!)
        : undefined,
      followersMax: searchParams.get('followersMax')
        ? parseInt(searchParams.get('followersMax')!)
        : undefined,
      avgLikesMin: searchParams.get('avgLikesMin')
        ? parseInt(searchParams.get('avgLikesMin')!)
        : undefined,
      avgLikesMax: searchParams.get('avgLikesMax')
        ? parseInt(searchParams.get('avgLikesMax')!)
        : undefined,
      engagementRateMin: searchParams.get('engagementRateMin')
        ? parseFloat(searchParams.get('engagementRateMin')!)
        : undefined,
      engagementRateMax: searchParams.get('engagementRateMax')
        ? parseFloat(searchParams.get('engagementRateMax')!)
        : undefined,
      mainCategories: searchParams.get('mainCategories')?.split(',').filter(Boolean),
      collabTypes: searchParams.get('collabTypes')?.split(',').filter(Boolean),
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      status: searchParams.get('status')?.split(',').filter(Boolean),
    }

    // Get all matching influencers (no pagination)
    const sort = { field: 'created_at' as const, direction: 'desc' as const }
    const result = await getInfluencers(filters, sort, 1, 10000)

    // Convert to Excel
    const headers = [
      '이름',
      '플랫폼',
      '핸들',
      '프로필 URL',
      '국가',
      '도시',
      '언어',
      '팔로워',
      '평균 좋아요',
      '평균 댓글',
      '참여율',
      '주요 카테고리',
      '하위 카테고리',
      '협업 유형',
      '기본 가격',
      '연락처 이메일',
      '연락처 DM',
      '상태',
      '태그',
      '메모 요약',
      '생성일',
    ]

    const rows = result.data.map((inf) => [
      inf.name,
      inf.platform,
      inf.handle,
      inf.profileUrl || '',
      inf.country || '',
      inf.city || '',
      inf.languages?.join('; ') || '',
      inf.followers || '',
      inf.avgLikes || '',
      inf.avgComments || '',
      inf.engagementRate || '',
      inf.mainCategory || '',
      inf.subCategories?.join('; ') || '',
      inf.collabTypes?.join('; ') || '',
      inf.basePriceText || '',
      inf.contactEmail || '',
      inf.contactDm || '',
      inf.status,
      inf.tags?.join('; ') || '',
      inf.notesSummary || '',
      new Date(inf.createdAt).toISOString(),
    ])

    // Create workbook
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '인플루언서')

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const fileName = `인플루언서_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting influencers:', error)
    return NextResponse.json(
      { error: 'Failed to export influencers' },
      { status: 500 }
    )
  }
}

