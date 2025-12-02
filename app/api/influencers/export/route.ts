import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getInfluencers } from '@/lib/repositories/influencers'

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

    // Convert to CSV
    const headers = [
      'Name',
      'Platform',
      'Handle',
      'Profile URL',
      'Country',
      'City',
      'Languages',
      'Followers',
      'Avg Likes',
      'Avg Comments',
      'Engagement Rate',
      'Main Category',
      'Sub Categories',
      'Collab Types',
      'Base Price',
      'Contact Email',
      'Contact DM',
      'Status',
      'Tags',
      'Notes Summary',
      'Created At',
    ]

    const rows = result.data.map((inf) => [
      inf.name,
      inf.platform,
      inf.handle,
      inf.profileUrl || '',
      inf.country || '',
      inf.city || '',
      inf.languages?.join('; ') || '',
      inf.followers?.toString() || '',
      inf.avgLikes?.toString() || '',
      inf.avgComments?.toString() || '',
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

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="influencers-${new Date().toISOString().split('T')[0]}.csv"`,
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

