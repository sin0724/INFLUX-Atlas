import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getInfluencers, getFilterOptions } from '@/lib/repositories/influencers'
import { db } from '@/lib/db'
import { influencers } from '@/lib/db/schema'

// 한국어 숫자 단위 파싱 함수 (예: "3.1만" → 31000, "1.3천" → 1300)
function parseKoreanNumber(value: string | number): number | null {
  if (typeof value === 'number') {
    return Math.round(value)
  }

  if (!value || typeof value !== 'string') {
    return null
  }

  const trimmed = String(value).trim().replace(/,/g, '') // 쉼표 제거
  const match = trimmed.match(/^([\d.]+)\s*(만|천)?$/)
  
  if (!match) {
    // 일반 숫자만 있는 경우
    const num = parseFloat(trimmed)
    return isNaN(num) ? null : Math.round(num)
  }

  const numberPart = parseFloat(match[1])
  const unit = match[2]

  if (isNaN(numberPart)) {
    return null
  }

  if (unit === '만') {
    return Math.round(numberPart * 10000)
  } else if (unit === '천') {
    return Math.round(numberPart * 1000)
  } else {
    // 단위가 없는 경우
    return Math.round(numberPart)
  }
}

// 인게이지먼트 비율 자동 계산 함수
function calculateEngagementRate(
  followers: number | null | undefined,
  avgLikes: number | null | undefined,
  avgComments: number | null | undefined,
  avgShares: number | null | undefined
): string | null {
  if (!followers || followers === 0) {
    return null
  }

  const likes = avgLikes || 0
  const comments = avgComments || 0
  const shares = avgShares || 0

  const totalEngagement = likes + comments + shares
  if (totalEngagement === 0) {
    return null
  }

  const rate = (totalEngagement / followers) * 100
  return rate.toFixed(2)
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      platform,
      handle,
      profileUrl,
      country,
      city,
      languages,
      followers,
      avgLikes,
      avgComments,
      avgShares,
      engagementRate,
      mainCategory,
      subCategories,
      collabTypes,
      basePriceText,
      contactEmail,
      contactDm,
      status = 'candidate',
      tags,
      notesSummary,
    } = body

    // Validate required fields
    if (!name || !platform) {
      return NextResponse.json(
        { error: 'Name and platform are required' },
        { status: 400 }
      )
    }

    // Auto-generate handle if not provided
    let finalHandle = handle
    if (!finalHandle) {
      if (profileUrl) {
        try {
          const url = new URL(profileUrl)
          const pathParts = url.pathname.split('/').filter(Boolean)
          if (pathParts.length > 0) {
            finalHandle = pathParts[pathParts.length - 1].replace('@', '')
          } else {
            finalHandle = name.toLowerCase().replace(/\s+/g, '')
          }
        } catch {
          finalHandle = name.toLowerCase().replace(/\s+/g, '')
        }
      } else {
        finalHandle = name.toLowerCase().replace(/\s+/g, '')
      }
    }

    // Process array fields
    const processedLanguages = Array.isArray(languages)
      ? languages
      : typeof languages === 'string'
      ? languages.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
      : []

    const processedSubCategories = Array.isArray(subCategories)
      ? subCategories
      : typeof subCategories === 'string'
      ? subCategories.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
      : []

    const processedCollabTypes = Array.isArray(collabTypes)
      ? collabTypes
      : typeof collabTypes === 'string'
      ? collabTypes.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
      : []

    const processedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean)
      : []

    // 숫자 변환 (한국어 단위 지원: "3.1만", "1.3천")
    const followersNum = followers ? parseKoreanNumber(String(followers)) : null
    const avgLikesNum = avgLikes ? parseKoreanNumber(String(avgLikes)) : null
    const avgCommentsNum = avgComments ? parseKoreanNumber(String(avgComments)) : null
    const avgSharesNum = avgShares ? parseKoreanNumber(String(avgShares)) : null

    // 인게이지먼트 비율 자동 계산 (제공되지 않았을 때만)
    let finalEngagementRate = engagementRate ? String(engagementRate) : null
    if (!finalEngagementRate && followersNum && followersNum > 0) {
      const calculatedRate = calculateEngagementRate(
        followersNum,
        avgLikesNum,
        avgCommentsNum,
        avgSharesNum
      )
      if (calculatedRate) {
        finalEngagementRate = calculatedRate
      }
    }

    const [newInfluencer] = await db
      .insert(influencers)
      .values({
        name,
        platform,
        handle: finalHandle,
        profileUrl: profileUrl || null,
        country: country || null,
        city: city || null,
        languages: processedLanguages.length > 0 ? processedLanguages : null,
        followers: followersNum,
        avgLikes: avgLikesNum,
        avgComments: avgCommentsNum,
        avgShares: avgSharesNum,
        engagementRate: finalEngagementRate,
        mainCategory: mainCategory || null,
        subCategories: processedSubCategories.length > 0 ? processedSubCategories : null,
        collabTypes: processedCollabTypes.length > 0 ? processedCollabTypes : null,
        basePriceText: basePriceText || null,
        contactEmail: contactEmail || null,
        contactDm: contactDm || null,
        status,
        tags: processedTags.length > 0 ? processedTags : null,
        notesSummary: notesSummary || null,
        createdBy: user.id,
      })
      .returning()

    return NextResponse.json(newInfluencer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating influencer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create influencer' },
      { status: 500 }
    )
  }
}

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

