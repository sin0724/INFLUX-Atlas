import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { influencerNotes, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const notes = await db
      .select({
        id: influencerNotes.id,
        content: influencerNotes.content,
        createdAt: influencerNotes.createdAt,
        author: {
          name: users.name,
        },
      })
      .from(influencerNotes)
      .leftJoin(users, eq(influencerNotes.authorId, users.id))
      .where(eq(influencerNotes.influencerId, params.id))
      .orderBy(desc(influencerNotes.createdAt))

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const [note] = await db
      .insert(influencerNotes)
      .values({
        influencerId: params.id,
        authorId: user.id,
        content: content.trim(),
      })
      .returning()

    // Fetch with author info
    const [noteWithAuthor] = await db
      .select({
        id: influencerNotes.id,
        content: influencerNotes.content,
        createdAt: influencerNotes.createdAt,
        author: {
          name: users.name,
        },
      })
      .from(influencerNotes)
      .leftJoin(users, eq(influencerNotes.authorId, users.id))
      .where(eq(influencerNotes.id, note.id))
      .limit(1)

    return NextResponse.json(noteWithAuthor)
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}

