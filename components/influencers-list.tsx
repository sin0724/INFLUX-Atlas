'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody } from '@/components/ui/drawer'
import { InfluencerDetail } from '@/components/influencer-detail'
import { Search, Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Influencer {
  id: string
  name: string
  platform: string
  handle: string
  profileUrl: string | null
  country: string | null
  city: string | null
  languages: string[] | null
  followers: number | null
  avgLikes: number | null
  avgComments: number | null
  engagementRate: string | null
  mainCategory: string | null
  subCategories: string[] | null
  collabTypes: string[] | null
  basePriceText: string | null
  contactEmail: string | null
  contactDm: string | null
  status: string
  tags: string[] | null
  notesSummary: string | null
  createdAt: string
}

interface FilterOptions {
  platforms: string[]
  countries: string[]
  categories: string[]
  collabTypes: string[]
  tags: string[]
}

export function InfluencersList() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [followersMin, setFollowersMin] = useState('')
  const [followersMax, setFollowersMax] = useState('')
  const [engagementRateMin, setEngagementRateMin] = useState('')
  const [engagementRateMax, setEngagementRateMax] = useState('')
  const [mainCategories, setMainCategories] = useState<string[]>([])
  const [collabTypes, setCollabTypes] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState<string[]>([])

  // Sort
  const [sortField, setSortField] = useState<'followers' | 'engagement_rate' | 'created_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // UI state
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    platforms: [],
    countries: [],
    categories: [],
    collabTypes: [],
    tags: [],
  })

  // Fetch filter options
  useEffect(() => {
    fetch('/api/influencers?action=options')
      .then((res) => res.json())
      .then((data) => setFilterOptions(data))
  }, [])

  // Fetch influencers
  const fetchInfluencers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (platforms.length) params.set('platforms', platforms.join(','))
      if (countries.length) params.set('countries', countries.join(','))
      if (followersMin) params.set('followersMin', followersMin)
      if (followersMax) params.set('followersMax', followersMax)
      if (engagementRateMin) params.set('engagementRateMin', engagementRateMin)
      if (engagementRateMax) params.set('engagementRateMax', engagementRateMax)
      if (mainCategories.length) params.set('mainCategories', mainCategories.join(','))
      if (collabTypes.length) params.set('collabTypes', collabTypes.join(','))
      if (tags.length) params.set('tags', tags.join(','))
      if (status.length) params.set('status', status.join(','))
      params.set('sortField', sortField)
      params.set('sortDirection', sortDirection)
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())

      const res = await fetch(`/api/influencers?${params}`)
      const data = await res.json()
      setInfluencers(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching influencers:', error)
    } finally {
      setLoading(false)
    }
  }, [
    search,
    platforms,
    countries,
    followersMin,
    followersMax,
    engagementRateMin,
    engagementRateMax,
    mainCategories,
    collabTypes,
    tags,
    status,
    sortField,
    sortDirection,
    page,
    pageSize,
  ])

  useEffect(() => {
    fetchInfluencers()
  }, [fetchInfluencers])

  const handleSort = (field: 'followers' | 'engagement_rate' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setPage(1)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (platforms.length) params.set('platforms', platforms.join(','))
    if (countries.length) params.set('countries', countries.join(','))
    if (followersMin) params.set('followersMin', followersMin)
    if (followersMax) params.set('followersMax', followersMax)
    if (engagementRateMin) params.set('engagementRateMin', engagementRateMin)
    if (engagementRateMax) params.set('engagementRateMax', engagementRateMax)
    if (mainCategories.length) params.set('mainCategories', mainCategories.join(','))
    if (collabTypes.length) params.set('collabTypes', collabTypes.join(','))
    if (tags.length) params.set('tags', tags.join(','))
    if (status.length) params.set('status', status.join(','))

    window.open(`/api/influencers/export?${params}`, '_blank')
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleAllSelection = (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedIds.size === influencers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(influencers.map((inf) => inf.id)))
    }
  }

  const FilterPanel = () => (
    <div className="space-y-6 p-4">
      <div>
        <label className="text-sm font-medium mb-2 block">플랫폼</label>
        <div className="space-y-2">
          {filterOptions.platforms.map((p) => (
            <label key={p} className="flex items-center space-x-2">
              <Checkbox
                checked={platforms.includes(p)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPlatforms([...platforms, p])
                  } else {
                    setPlatforms(platforms.filter((x) => x !== p))
                  }
                  setPage(1)
                }}
              />
              <span className="text-sm capitalize">{p}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">국가</label>
        <Select
          value=""
          onChange={(e) => {
            const value = e.target.value
            if (value && !countries.includes(value)) {
              setCountries([...countries, value])
              setPage(1)
            }
          }}
        >
          <option value="">국가 선택...</option>
          {filterOptions.countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        {countries.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {countries.map((c) => (
              <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => setCountries(countries.filter((x) => x !== c))}>
                {c} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">팔로워</label>
        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="최소"
            value={followersMin}
            onChange={(e) => {
              setFollowersMin(e.target.value)
              setPage(1)
            }}
          />
          <Input
            type="number"
            placeholder="최대"
            value={followersMax}
            onChange={(e) => {
              setFollowersMax(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">참여율</label>
        <div className="flex space-x-2">
          <Input
            type="number"
            step="0.01"
            placeholder="최소"
            value={engagementRateMin}
            onChange={(e) => {
              setEngagementRateMin(e.target.value)
              setPage(1)
            }}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="최대"
            value={engagementRateMax}
            onChange={(e) => {
              setEngagementRateMax(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">주요 카테고리</label>
        <div className="space-y-2">
          {filterOptions.categories.map((c) => (
            <label key={c} className="flex items-center space-x-2">
              <Checkbox
                checked={mainCategories.includes(c)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setMainCategories([...mainCategories, c])
                  } else {
                    setMainCategories(mainCategories.filter((x) => x !== c))
                  }
                  setPage(1)
                }}
              />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">상태</label>
        <div className="space-y-2">
          {['candidate', 'active', 'blacklist'].map((s) => (
            <label key={s} className="flex items-center space-x-2">
              <Checkbox
                checked={status.includes(s)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setStatus([...status, s])
                  } else {
                    setStatus(status.filter((x) => x !== s))
                  }
                  setPage(1)
                }}
              />
              <span className="text-sm">{s === 'candidate' ? '후보' : s === 'active' ? '활성' : '블랙리스트'}</span>
            </label>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSearch('')
          setPlatforms([])
          setCountries([])
          setFollowersMin('')
          setFollowersMax('')
          setEngagementRateMin('')
          setEngagementRateMax('')
          setMainCategories([])
          setCollabTypes([])
          setTags([])
          setStatus([])
          setPage(1)
        }}
      >
        필터 초기화
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">인플루언서</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              CSV 내보내기
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilterOpen(!filterOpen)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filter Sidebar (Desktop) */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <FilterPanel />
            </Card>
          </div>

          {/* Filter Drawer (Mobile) */}
          <Drawer open={filterOpen} onOpenChange={setFilterOpen} side="left">
            <DrawerContent onClose={() => setFilterOpen(false)}>
              <DrawerHeader>
                <DrawerTitle>필터</DrawerTitle>
              </DrawerHeader>
              <DrawerBody>
                <FilterPanel />
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="이름, 핸들, 태그, 메모로 검색..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <Card>
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">로딩 중...</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedIds.size === influencers.length && influencers.length > 0}
                              onChange={toggleAllSelection}
                            />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleSort('created_at')}
                          >
                            <div className="flex items-center">
                              이름
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>플랫폼</TableHead>
                          <TableHead>핸들</TableHead>
                          <TableHead>위치</TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleSort('followers')}
                          >
                            <div className="flex items-center">
                              팔로워
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>평균 좋아요</TableHead>
                          <TableHead
                            className="cursor-pointer"
                            onClick={() => handleSort('engagement_rate')}
                          >
                            <div className="flex items-center">
                              참여율
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>카테고리</TableHead>
                          <TableHead>협업 유형</TableHead>
                          <TableHead>태그</TableHead>
                          <TableHead>상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {influencers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={13} className="text-center text-muted-foreground">
                              인플루언서를 찾을 수 없습니다
                            </TableCell>
                          </TableRow>
                        ) : (
                          influencers.map((influencer) => (
                            <TableRow
                              key={influencer.id}
                              className="cursor-pointer"
                              onClick={() => setSelectedInfluencer(influencer)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedIds.has(influencer.id)}
                                  onChange={() => toggleSelection(influencer.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{influencer.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {influencer.platform}
                                </Badge>
                              </TableCell>
                              <TableCell>@{influencer.handle}</TableCell>
                              <TableCell>
                                {influencer.city && influencer.country
                                  ? `${influencer.city}, ${influencer.country}`
                                  : influencer.country || influencer.city || '-'}
                              </TableCell>
                              <TableCell>
                                {influencer.followers
                                  ? influencer.followers.toLocaleString()
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {influencer.avgLikes
                                  ? influencer.avgLikes.toLocaleString()
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {influencer.engagementRate
                                  ? `${parseFloat(influencer.engagementRate).toFixed(2)}%`
                                  : '-'}
                              </TableCell>
                              <TableCell>{influencer.mainCategory || '-'}</TableCell>
                              <TableCell>
                                {influencer.collabTypes && influencer.collabTypes.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {influencer.collabTypes.slice(0, 2).map((ct) => (
                                      <Badge key={ct} variant="secondary" className="text-xs">
                                        {ct}
                                      </Badge>
                                    ))}
                                    {influencer.collabTypes.length > 2 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{influencer.collabTypes.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                {influencer.tags && influencer.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {influencer.tags.slice(0, 2).map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {influencer.tags.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{influencer.tags.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  '-'
                                )}
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
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} / 총 {total}개
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                        >
                          처음
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          이전
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                          {page} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page === totalPages}
                        >
                          다음
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(totalPages)}
                          disabled={page === totalPages}
                        >
                          마지막
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Detail Sheet */}
      {selectedInfluencer && (
        <InfluencerDetail
          influencer={selectedInfluencer}
          onClose={() => setSelectedInfluencer(null)}
          onUpdate={fetchInfluencers}
        />
      )}
    </div>
  )
}

