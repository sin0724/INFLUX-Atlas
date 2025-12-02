import { NextResponse } from 'next/server'
import postgres from 'postgres'

export async function GET() {
  try {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      return NextResponse.json(
        {
          error: 'DATABASE_URL is not set',
          status: 'missing_env',
        },
        { status: 500 }
      )
    }

    // Test connection
    const client = postgres(connectionString, {
      max: 1,
      connect_timeout: 10,
    })

    const result = await client`SELECT version()`
    await client.end()

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      version: result[0].version,
      connectionString: connectionString.replace(/:[^:@]+@/, ':****@'), // Hide password
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        code: error.code,
        severity: error.severity,
        hint: error.hint || 'Check your DATABASE_URL and Supabase project status',
      },
      { status: 500 }
    )
  }
}

