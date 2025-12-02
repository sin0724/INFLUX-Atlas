'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Save, Edit2, X } from 'lucide-react'

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

interface Note {
  id: string
  content: string
  createdAt: string
  author: {
    name: string
  }
}

interface InfluencerDetailProps {
  influencer: Influencer
  onClose: () => void
  onUpdate: () => void
}

export function InfluencerDetail({ influencer: initialInfluencer, onClose, onUpdate }: InfluencerDetailProps) {
  const [influencer, setInfluencer] = useState(initialInfluencer)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'staff'>('staff')
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    fetch(`/api/influencers/${influencer.id}`)
      .then((res) => res.json())
      .then((data) => setInfluencer(data))

    fetch(`/api/influencers/${influencer.id}/notes`)
      .then((res) => res.json())
      .then((data) => setNotes(data))

    // Get user role
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUserRole(data.role))
      .catch(() => {})
  }, [influencer.id])

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/influencers/${influencer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(influencer),
      })

      if (res.ok) {
        setIsEditing(false)
        onUpdate()
      }
    } catch (error) {
      console.error('Error saving influencer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/influencers/${influencer.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      })

      if (res.ok) {
        const note = await res.json()
        setNotes([note, ...notes])
        setNewNote('')
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setLoading(false)
    }
  }

  const canEdit = userRole === 'admin'

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent onClose={onClose} className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{influencer.name}</SheetTitle>
            {canEdit && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    수정
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        <SheetBody>
          <div className="w-full">
            <Tabs defaultValue="profile">
              <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">프로필</TabsTrigger>
              <TabsTrigger value="collab">협업 & 가격</TabsTrigger>
              <TabsTrigger value="notes">메모</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>이름</Label>
                  {isEditing ? (
                    <Input
                      value={influencer.name}
                      onChange={(e) => setInfluencer({ ...influencer, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm mt-1">{influencer.name}</p>
                  )}
                </div>
                <div>
                  <Label>플랫폼</Label>
                  {isEditing ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={influencer.platform}
                      onChange={(e) => setInfluencer({ ...influencer, platform: e.target.value })}
                    >
                      <option value="instagram">Instagram</option>
                      <option value="threads">Threads</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm mt-1 capitalize">{influencer.platform}</p>
                  )}
                </div>
                <div>
                  <Label>핸들</Label>
                  {isEditing ? (
                    <Input
                      value={influencer.handle}
                      onChange={(e) => setInfluencer({ ...influencer, handle: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm mt-1">@{influencer.handle}</p>
                  )}
                </div>
                <div>
                  <Label>상태</Label>
                  {isEditing ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={influencer.status}
                      onChange={(e) => setInfluencer({ ...influencer, status: e.target.value })}
                    >
                      <option value="candidate">후보</option>
                      <option value="active">활성</option>
                      <option value="blacklist">블랙리스트</option>
                    </select>
                  ) : (
                    <Badge
                      variant={
                        influencer.status === 'active'
                          ? 'default'
                          : influencer.status === 'blacklist'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="mt-1 capitalize"
                    >
                      {influencer.status === 'active' ? '활성' : influencer.status === 'blacklist' ? '블랙리스트' : '후보'}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label>프로필 URL</Label>
                  {isEditing ? (
                    <Input
                      value={influencer.profileUrl || ''}
                      onChange={(e) => setInfluencer({ ...influencer, profileUrl: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      {influencer.profileUrl ? (
                        <a href={influencer.profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {influencer.profileUrl}
                        </a>
                      ) : (
                        '-'
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <Label>국가</Label>
                  {isEditing ? (
                    <Input
                      value={influencer.country || ''}
                      onChange={(e) => setInfluencer({ ...influencer, country: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm mt-1">{influencer.country || '-'}</p>
                  )}
                </div>
                <div>
                  <Label>도시</Label>
                  {isEditing ? (
                    <Input
                      value={influencer.city || ''}
                      onChange={(e) => setInfluencer({ ...influencer, city: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm mt-1">{influencer.city || '-'}</p>
                  )}
                </div>
                <div>
                  <Label>언어</Label>
                  <p className="text-sm mt-1">{influencer.languages?.join(', ') || '-'}</p>
                </div>
                <div>
                  <Label>팔로워</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={influencer.followers || ''}
                      onChange={(e) => setInfluencer({ ...influencer, followers: parseInt(e.target.value) || null })}
                    />
                  ) : (
                    <p className="text-sm mt-1">{influencer.followers?.toLocaleString() || '-'}</p>
                  )}
                </div>
                <div>
                  <Label>평균 좋아요</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={influencer.avgLikes || ''}
                      onChange={(e) => setInfluencer({ ...influencer, avgLikes: parseInt(e.target.value) || null })}
                    />
                  ) : (
                    <p className="text-sm mt-1">{influencer.avgLikes?.toLocaleString() || '-'}</p>
                  )}
                </div>
                <div>
                  <Label>평균 댓글</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={influencer.avgComments || ''}
                      onChange={(e) => setInfluencer({ ...influencer, avgComments: parseInt(e.target.value) || null })}
                    />
                  ) : (
                    <p className="text-sm mt-1">{influencer.avgComments?.toLocaleString() || '-'}</p>
                  )}
                </div>
                <div>
                  <Label>참여율</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={influencer.engagementRate || ''}
                      onChange={(e) => setInfluencer({ ...influencer, engagementRate: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      {influencer.engagementRate ? `${parseFloat(influencer.engagementRate).toFixed(2)}%` : '-'}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="collab" className="space-y-4 mt-4">
              <div>
                <Label>주요 카테고리</Label>
                {isEditing ? (
                  <Input
                    value={influencer.mainCategory || ''}
                    onChange={(e) => setInfluencer({ ...influencer, mainCategory: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1">{influencer.mainCategory || '-'}</p>
                )}
              </div>
              <div>
                <Label>하위 카테고리</Label>
                <p className="text-sm mt-1">{influencer.subCategories?.join(', ') || '-'}</p>
              </div>
              <div>
                <Label>협업 유형</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {influencer.collabTypes && influencer.collabTypes.length > 0 ? (
                    influencer.collabTypes.map((ct) => (
                      <Badge key={ct} variant="secondary">
                        {ct}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div>
                <Label>기본 가격</Label>
                {isEditing ? (
                  <Textarea
                    value={influencer.basePriceText || ''}
                    onChange={(e) => setInfluencer({ ...influencer, basePriceText: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1 whitespace-pre-wrap">{influencer.basePriceText || '-'}</p>
                )}
              </div>
              <div>
                <Label>연락처 이메일</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={influencer.contactEmail || ''}
                    onChange={(e) => setInfluencer({ ...influencer, contactEmail: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1">{influencer.contactEmail || '-'}</p>
                )}
              </div>
              <div>
                <Label>연락처 DM</Label>
                {isEditing ? (
                  <Input
                    value={influencer.contactDm || ''}
                    onChange={(e) => setInfluencer({ ...influencer, contactDm: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1">{influencer.contactDm || '-'}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-4">
              <div>
                <Label>메모 요약</Label>
                {isEditing ? (
                  <Textarea
                    value={influencer.notesSummary || ''}
                    onChange={(e) => setInfluencer({ ...influencer, notesSummary: e.target.value })}
                  />
                ) : (
                  <p className="text-sm mt-1 whitespace-pre-wrap">{influencer.notesSummary || '-'}</p>
                )}
              </div>

              <div>
                <Label>메모 추가</Label>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="이 인플루언서에 대한 메모를 추가하세요..."
                  className="mt-1"
                />
                <Button onClick={handleAddNote} disabled={loading || !newNote.trim()} className="mt-2">
                  메모 추가
                </Button>
              </div>

              <div>
                <Label>메모 내역</Label>
                <div className="space-y-3 mt-2">
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">메모가 없습니다</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="p-3 border rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.author.name} • {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: ko })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
            </Tabs>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

