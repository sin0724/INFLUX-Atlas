import { pgTable, uuid, text, integer, numeric, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff'])
export const platformEnum = pgEnum('platform', ['instagram', 'threads', 'youtube', 'tiktok', 'other'])
export const statusEnum = pgEnum('status', ['candidate', 'active', 'blacklist'])

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(), // 내부적으로 username@local 형식으로 저장
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('staff'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Influencers table
export const influencers = pgTable('influencers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  platform: platformEnum('platform').notNull(),
  handle: text('handle').notNull(),
  profileUrl: text('profile_url'),
  country: text('country'),
  city: text('city'),
  languages: text('languages').array(),
  followers: integer('followers'),
  avgLikes: integer('avg_likes'),
  avgComments: integer('avg_comments'),
  avgShares: integer('avg_shares'),
  engagementRate: numeric('engagement_rate'),
  mainCategory: text('main_category'),
  subCategories: text('sub_categories').array(),
  collabTypes: text('collab_types').array(),
  basePriceText: text('base_price_text'),
  contactEmail: text('contact_email'),
  contactDm: text('contact_dm'),
  status: statusEnum('status').notNull().default('candidate'),
  tags: text('tags').array(),
  notesSummary: text('notes_summary'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Influencer notes table
export const influencerNotes = pgTable('influencer_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  influencerId: uuid('influencer_id').notNull().references(() => influencers.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Import batches table
export const importBatches = pgTable('import_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: text('file_name').notNull(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  totalRows: integer('total_rows').notNull(),
  successRows: integer('success_rows').notNull().default(0),
  errorRows: integer('error_rows').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Import errors table
export const importErrors = pgTable('import_errors', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull().references(() => importBatches.id, { onDelete: 'cascade' }),
  rowIndex: integer('row_index').notNull(),
  errorMessage: text('error_message').notNull(),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdInfluencers: many(influencers),
  notes: many(influencerNotes),
  importBatches: many(importBatches),
}))

export const influencersRelations = relations(influencers, ({ one, many }) => ({
  creator: one(users, {
    fields: [influencers.createdBy],
    references: [users.id],
  }),
  notes: many(influencerNotes),
}))

export const influencerNotesRelations = relations(influencerNotes, ({ one }) => ({
  influencer: one(influencers, {
    fields: [influencerNotes.influencerId],
    references: [influencers.id],
  }),
  author: one(users, {
    fields: [influencerNotes.authorId],
    references: [users.id],
  }),
}))

export const importBatchesRelations = relations(importBatches, ({ one, many }) => ({
  uploader: one(users, {
    fields: [importBatches.uploadedBy],
    references: [users.id],
  }),
  errors: many(importErrors),
}))

export const importErrorsRelations = relations(importErrors, ({ one }) => ({
  batch: one(importBatches, {
    fields: [importErrors.batchId],
    references: [importBatches.id],
  }),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Influencer = typeof influencers.$inferSelect
export type NewInfluencer = typeof influencers.$inferInsert
export type InfluencerNote = typeof influencerNotes.$inferSelect
export type NewInfluencerNote = typeof influencerNotes.$inferInsert
export type ImportBatch = typeof importBatches.$inferSelect
export type NewImportBatch = typeof importBatches.$inferInsert
export type ImportError = typeof importErrors.$inferSelect
export type NewImportError = typeof importErrors.$inferInsert

