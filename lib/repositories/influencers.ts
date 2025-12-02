import { db } from '@/lib/db'
import { influencers } from '@/lib/db/schema'
import { eq, and, or, like, ilike, inArray, gte, lte, desc, asc, sql } from 'drizzle-orm'
import type { Influencer } from '@/lib/db/schema'

export interface InfluencerFilters {
  search?: string
  platforms?: string[]
  countries?: string[]
  cities?: string[]
  followersMin?: number
  followersMax?: number
  avgLikesMin?: number
  avgLikesMax?: number
  engagementRateMin?: number
  engagementRateMax?: number
  mainCategories?: string[]
  collabTypes?: string[]
  tags?: string[]
  status?: string[]
}

export interface InfluencerSort {
  field: 'followers' | 'engagement_rate' | 'created_at'
  direction: 'asc' | 'desc'
}

export async function getInfluencers(
  filters: InfluencerFilters = {},
  sort: InfluencerSort = { field: 'created_at', direction: 'desc' },
  page: number = 1,
  pageSize: number = 20
) {
  const conditions = []

  // Search
  if (filters.search) {
    const searchTerm = `%${filters.search}%`
    conditions.push(
      or(
        ilike(influencers.name, searchTerm),
        ilike(influencers.handle, searchTerm),
        ilike(influencers.notesSummary, searchTerm),
        sql`${influencers.tags}::text ILIKE ${searchTerm}`
      )!
    )
  }

  // Platform filter
  if (filters.platforms && filters.platforms.length > 0) {
    conditions.push(inArray(influencers.platform, filters.platforms as any))
  }

  // Country filter
  if (filters.countries && filters.countries.length > 0) {
    conditions.push(inArray(influencers.country, filters.countries))
  }

  // City filter
  if (filters.cities && filters.cities.length > 0) {
    conditions.push(inArray(influencers.city, filters.cities))
  }

  // Followers range
  if (filters.followersMin !== undefined) {
    conditions.push(gte(influencers.followers, filters.followersMin))
  }
  if (filters.followersMax !== undefined) {
    conditions.push(lte(influencers.followers, filters.followersMax))
  }

  // Avg likes range
  if (filters.avgLikesMin !== undefined) {
    conditions.push(gte(influencers.avgLikes, filters.avgLikesMin))
  }
  if (filters.avgLikesMax !== undefined) {
    conditions.push(lte(influencers.avgLikes, filters.avgLikesMax))
  }

  // Engagement rate range
  if (filters.engagementRateMin !== undefined) {
    conditions.push(gte(influencers.engagementRate, filters.engagementRateMin.toString()))
  }
  if (filters.engagementRateMax !== undefined) {
    conditions.push(lte(influencers.engagementRate, filters.engagementRateMax.toString()))
  }

  // Main category filter
  if (filters.mainCategories && filters.mainCategories.length > 0) {
    conditions.push(inArray(influencers.mainCategory, filters.mainCategories))
  }

  // Collab types filter (array contains)
  if (filters.collabTypes && filters.collabTypes.length > 0) {
    conditions.push(
      sql`${influencers.collabTypes} && ${filters.collabTypes}::text[]`
    )
  }

  // Tags filter (array contains)
  if (filters.tags && filters.tags.length > 0) {
    conditions.push(
      sql`${influencers.tags} && ${filters.tags}::text[]`
    )
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(influencers.status, filters.status as any))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Sorting
  let orderBy
  if (sort.field === 'followers') {
    orderBy = sort.direction === 'asc' ? asc(influencers.followers) : desc(influencers.followers)
  } else if (sort.field === 'engagement_rate') {
    orderBy = sort.direction === 'asc' ? asc(influencers.engagementRate) : desc(influencers.engagementRate)
  } else {
    orderBy = sort.direction === 'asc' ? asc(influencers.createdAt) : desc(influencers.createdAt)
  }

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(influencers)
    .where(whereClause)

  const total = Number(countResult.count)

  // Get paginated results
  const offset = (page - 1) * pageSize
  const results = await db
    .select()
    .from(influencers)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset)

  return {
    data: results,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getInfluencerById(id: string) {
  const [result] = await db
    .select()
    .from(influencers)
    .where(eq(influencers.id, id))
    .limit(1)

  return result || null
}

export async function getFilterOptions() {
  const platforms = await db
    .selectDistinct({ platform: influencers.platform })
    .from(influencers)

  const countries = await db
    .selectDistinct({ country: influencers.country })
    .from(influencers)
    .where(sql`${influencers.country} IS NOT NULL`)

  const cities = await db
    .selectDistinct({ city: influencers.city })
    .from(influencers)
    .where(sql`${influencers.city} IS NOT NULL`)

  const categories = await db
    .selectDistinct({ category: influencers.mainCategory })
    .from(influencers)
    .where(sql`${influencers.mainCategory} IS NOT NULL`)

  // Get all unique collab types and tags
  const allInfluencers = await db.select().from(influencers)
  const collabTypes = new Set<string>()
  const tags = new Set<string>()

  allInfluencers.forEach((inf) => {
    inf.collabTypes?.forEach((ct) => collabTypes.add(ct))
    inf.tags?.forEach((tag) => tags.add(tag))
  })

  return {
    platforms: platforms.map((p) => p.platform),
    countries: countries.map((c) => c.country).filter(Boolean),
    cities: cities.map((c) => c.city).filter(Boolean),
    categories: categories.map((c) => c.category).filter(Boolean),
    collabTypes: Array.from(collabTypes),
    tags: Array.from(tags),
  }
}

