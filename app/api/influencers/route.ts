import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getInfluencers, getFilterOptions } from '@/lib/repositories/influencers'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'options') {
      const options = await getFilterOptions()
      return NextResponse.json(options)
    }

    // Parse filters
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

    // Parse sort
    const sortField = (searchParams.get('sortField') || 'created_at') as 'followers' | 'engagement_rate' | 'created_at'
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc'
    const sort = { field: sortField, direction: sortDirection }

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await getInfluencers(filters, sort, page, pageSize)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching influencers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch influencers' },
      { status: 500 }
    )
  }
}

