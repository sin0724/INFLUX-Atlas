import { db } from '../lib/db'
import { users, influencers } from '../lib/db/schema'
import { createClient } from '@supabase/supabase-js'

// This script creates demo data
// Note: You'll need to create users in Supabase Auth first, then run this script

async function seed() {
  console.log('Seeding database...')

  // Note: In production, users should be created via Supabase Auth
  // For seeding, we assume you have at least one user in the database
  // You can create a user manually via Supabase dashboard or API

  const existingUsers = await db.select().from(users).limit(1)
  
  if (existingUsers.length === 0) {
    console.log('No users found. Please create a user first via Supabase Auth.')
    console.log('Then manually insert the user into the users table with the correct UUID.')
    return
  }

  const adminUser = existingUsers[0]

  // Sample influencers data
  const sampleInfluencers = [
    {
      name: 'Beauty Guru',
      platform: 'instagram' as const,
      handle: 'beautyguru',
      profileUrl: 'https://instagram.com/beautyguru',
      country: 'South Korea',
      city: 'Seoul',
      languages: ['ko', 'en'],
      followers: 500000,
      avgLikes: 25000,
      avgComments: 500,
      engagementRate: '5.1',
      mainCategory: 'beauty',
      subCategories: ['makeup', 'skincare'],
      collabTypes: ['trial', 'paid_ad'],
      basePriceText: 'Starting from $5,000 per post',
      contactEmail: 'contact@beautyguru.com',
      status: 'active' as const,
      tags: ['korean_beauty', 'verified'],
      notesSummary: 'High engagement rate, responsive to DMs',
      createdBy: adminUser.id,
    },
    {
      name: 'Food Explorer',
      platform: 'youtube' as const,
      handle: 'foodexplorer',
      profileUrl: 'https://youtube.com/@foodexplorer',
      country: 'Taiwan',
      city: 'Taipei',
      languages: ['zh-TW', 'en'],
      followers: 1200000,
      avgLikes: 60000,
      avgComments: 2000,
      engagementRate: '5.2',
      mainCategory: 'food',
      subCategories: ['restaurant_reviews', 'cooking'],
      collabTypes: ['trial', 'group_buy', 'live'],
      basePriceText: 'YouTube: $10,000, Instagram: $3,000',
      contactEmail: 'hello@foodexplorer.com',
      status: 'active' as const,
      tags: ['taiwan_KOL', 'foodie'],
      notesSummary: 'Great for restaurant partnerships',
      createdBy: adminUser.id,
    },
    {
      name: 'Fashionista',
      platform: 'instagram' as const,
      handle: 'fashionista',
      profileUrl: 'https://instagram.com/fashionista',
      country: 'Japan',
      city: 'Tokyo',
      languages: ['ja', 'en'],
      followers: 800000,
      avgLikes: 40000,
      avgComments: 800,
      engagementRate: '5.0',
      mainCategory: 'fashion',
      subCategories: ['streetwear', 'luxury'],
      collabTypes: ['trial', 'paid_ad'],
      basePriceText: 'Negotiable',
      contactDm: '@fashionista',
      status: 'candidate' as const,
      tags: ['japanese_fashion'],
      notesSummary: 'Interested in luxury brand collaborations',
      createdBy: adminUser.id,
    },
    {
      name: 'Tech Reviewer',
      platform: 'youtube' as const,
      handle: 'techreviewer',
      profileUrl: 'https://youtube.com/@techreviewer',
      country: 'Singapore',
      city: 'Singapore',
      languages: ['en', 'zh-CN'],
      followers: 2000000,
      avgLikes: 100000,
      avgComments: 5000,
      engagementRate: '5.3',
      mainCategory: 'technology',
      subCategories: ['gadgets', 'reviews'],
      collabTypes: ['trial', 'paid_ad'],
      basePriceText: 'YouTube: $15,000 per video',
      contactEmail: 'business@techreviewer.com',
      status: 'active' as const,
      tags: ['tech_KOL', 'verified'],
      notesSummary: 'High production quality, tech-savvy audience',
      createdBy: adminUser.id,
    },
    {
      name: 'Lifestyle Vlogger',
      platform: 'tiktok' as const,
      handle: 'lifestylevlog',
      profileUrl: 'https://tiktok.com/@lifestylevlog',
      country: 'Thailand',
      city: 'Bangkok',
      languages: ['th', 'en'],
      followers: 3000000,
      avgLikes: 150000,
      avgComments: 3000,
      engagementRate: '5.1',
      mainCategory: 'lifestyle',
      subCategories: ['daily_vlog', 'travel'],
      collabTypes: ['trial', 'paid_ad', 'live'],
      basePriceText: 'TikTok: $8,000 per video',
      contactDm: '@lifestylevlog',
      status: 'active' as const,
      tags: ['thailand_KOL', 'gen_z'],
      notesSummary: 'Trending content creator, high reach',
      createdBy: adminUser.id,
    },
  ]

  try {
    for (const influencer of sampleInfluencers) {
      await db.insert(influencers).values(influencer)
    }
    console.log(`Successfully seeded ${sampleInfluencers.length} influencers`)
  } catch (error) {
    console.error('Error seeding:', error)
  }
}

seed()
  .then(() => {
    console.log('Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })

