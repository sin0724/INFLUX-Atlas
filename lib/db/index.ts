import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please check Railway environment variables.')
}

const connectionString = process.env.DATABASE_URL

// Create connection with better error handling
let client: postgres.Sql
try {
  client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })
} catch (error: any) {
  console.error('Failed to create database client:', error.message)
  throw new Error(`Database connection failed: ${error.message}. Please check DATABASE_URL and Supabase project status.`)
}

export const db = drizzle(client, { schema })

