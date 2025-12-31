import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { influencers, importBatches, importErrors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

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
    const user = await requireAdmin()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappingJson = formData.get('mapping') as string
    const mapping: Record<string, string> = JSON.parse(mappingJson)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Parse file
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    let rawData: any[] = []

    if (fileExtension === 'csv') {
      const text = await file.text()
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      })
      rawData = result.data as any[]
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rawData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '', // 빈 셀을 빈 문자열로 처리
        raw: false 
      })
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 })
    }

    // Create import batch
    const [batch] = await db
      .insert(importBatches)
      .values({
        fileName: file.name,
        uploadedBy: user.id,
        totalRows: rawData.length,
        successRows: 0,
        errorRows: 0,
      })
      .returning()

    let successCount = 0
    const errorRows: Array<{ rowIndex: number; message: string; rawData: any }> = []

    // Process each row
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]
      const errors: string[] = []
      const influencerData: any = {
        createdBy: user.id,
      }

      // Map fields
      for (const [dbField, uploadedColumn] of Object.entries(mapping)) {
        if (!uploadedColumn) continue

        const value = row[uploadedColumn]
        if (value === null || value === undefined || value === '') {
          // Check if required
          if (['name', 'platform', 'handle'].includes(dbField)) {
            errors.push(`${dbField} is required`)
          }
          continue
        }

        const stringValue = String(value).trim()
        
        // 빈 문자열 체크
        if (!stringValue || stringValue === '') {
          // Check if required
          if (['name', 'platform', 'handle'].includes(dbField)) {
            errors.push(`${dbField} is required`)
          }
          continue
        }

        // Type conversion and validation
        switch (dbField) {
          case 'name':
          case 'handle':
          case 'profileUrl':
          case 'country':
          case 'city':
          case 'mainCategory':
          case 'basePriceText':
          case 'contactEmail':
          case 'contactDm':
          case 'notesSummary':
            influencerData[dbField] = stringValue
            break

          case 'platform':
            // 한글 플랫폼명을 영어로 변환
            const platformMap: Record<string, string> = {
              '인스타그램': 'instagram',
              'instagram': 'instagram',
              '인스타': 'instagram',
              '유튜브': 'youtube',
              'youtube': 'youtube',
              '틱톡': 'tiktok',
              'tiktok': 'tiktok',
              '티크톡': 'tiktok',
              '스레드': 'threads',
              'threads': 'threads',
              '기타': 'other',
              'other': 'other',
            }
            // 안전하게 toLowerCase 호출
            const normalizedPlatform = (stringValue && typeof stringValue === 'string') 
              ? stringValue.toLowerCase().trim() 
              : ''
            const mappedPlatform = normalizedPlatform ? (platformMap[normalizedPlatform] || normalizedPlatform) : ''
            
            if (!normalizedPlatform || !['instagram', 'threads', 'youtube', 'tiktok', 'other'].includes(mappedPlatform)) {
              errors.push(`Invalid platform: ${stringValue}`)
            } else {
              influencerData.platform = mappedPlatform
            }
            break

          case 'status':
            const status = (stringValue && typeof stringValue === 'string') 
              ? stringValue.toLowerCase().trim() 
              : ''
            if (!status || !['candidate', 'active', 'blacklist'].includes(status)) {
              errors.push(`Invalid status: ${stringValue}`)
            } else {
              influencerData.status = status
            }
            break

          case 'followers':
          case 'avgLikes':
          case 'avgComments':
          case 'avgShares':
            const num = parseInt(stringValue)
            if (isNaN(num)) {
              errors.push(`${dbField} must be a number`)
            } else {
              influencerData[dbField] = num
            }
            break

          case 'engagementRate':
            const rate = parseFloat(stringValue)
            if (isNaN(rate)) {
              errors.push(`${dbField} must be a number`)
            } else {
              influencerData.engagementRate = rate.toString()
            }
            break

          case 'languages':
          case 'subCategories':
          case 'collabTypes':
          case 'tags':
            // Split by comma or semicolon (안전하게 처리)
            if (stringValue && typeof stringValue === 'string') {
              influencerData[dbField] = stringValue
                .split(/[,;]/)
                .map((s) => s.trim())
                .filter(Boolean)
            }
            break

          default:
            influencerData[dbField] = stringValue
        }
      }

      // Validate required fields
      if (!influencerData.name || typeof influencerData.name !== 'string' || influencerData.name.trim() === '') {
        errors.push('name is required')
      }
      if (!influencerData.platform || typeof influencerData.platform !== 'string' || influencerData.platform.trim() === '') {
        errors.push('platform is required')
      }
      
      // 핸들 자동 생성 (프로필 URL에서 추출 또는 이름 기반)
      // name이 유효할 때만 핸들 생성 시도
      if (!influencerData.handle && influencerData.name && typeof influencerData.name === 'string') {
        if (influencerData.profileUrl) {
          // 프로필 URL에서 핸들 추출 시도
          try {
            const url = new URL(influencerData.profileUrl)
            const pathParts = url.pathname.split('/').filter(Boolean)
            if (pathParts.length > 0) {
              influencerData.handle = pathParts[pathParts.length - 1].replace('@', '')
            } else {
              // 이름 기반으로 생성 (안전하게 처리)
              const nameStr = influencerData.name && typeof influencerData.name === 'string' 
                ? influencerData.name 
                : ''
              influencerData.handle = nameStr.toLowerCase().replace(/\s+/g, '') || 'user'
            }
          } catch {
            // URL 파싱 실패 시 이름 기반으로 생성 (안전하게 처리)
            const nameStr = influencerData.name && typeof influencerData.name === 'string' 
              ? influencerData.name 
              : ''
            influencerData.handle = nameStr.toLowerCase().replace(/\s+/g, '') || 'user'
          }
        } else {
          // 프로필 URL도 없으면 이름 기반으로 생성 (안전하게 처리)
          const nameStr = influencerData.name && typeof influencerData.name === 'string' 
            ? influencerData.name 
            : ''
          influencerData.handle = nameStr.toLowerCase().replace(/\s+/g, '') || 'user'
        }
      }

      // 인게이지먼트 비율 자동 계산 (제공되지 않았을 때만)
      if (!influencerData.engagementRate) {
        const calculatedRate = calculateEngagementRate(
          influencerData.followers,
          influencerData.avgLikes,
          influencerData.avgComments,
          influencerData.avgShares
        )
        if (calculatedRate) {
          influencerData.engagementRate = calculatedRate
        }
      }

      if (errors.length > 0) {
        errorRows.push({
          rowIndex: i,
          message: errors.join('; '),
          rawData: row,
        })

        // Save error
        await db.insert(importErrors).values({
          batchId: batch.id,
          rowIndex: i,
          errorMessage: errors.join('; '),
          rawData: row as any,
        })
      } else {
        try {
          await db.insert(influencers).values(influencerData)
          successCount++
        } catch (error: any) {
          errorRows.push({
            rowIndex: i,
            message: error.message || 'Database error',
            rawData: row,
          })

          await db.insert(importErrors).values({
            batchId: batch.id,
            rowIndex: i,
            errorMessage: error.message || 'Database error',
            rawData: row as any,
          })
        }
      }
    }

    // Update batch
    await db
      .update(importBatches)
      .set({
        successRows: successCount,
        errorRows: errorRows.length,
      })
      .where(eq(importBatches.id, batch.id))

    return NextResponse.json({
      total: rawData.length,
      success: successCount,
      errors: errorRows.length,
      errorRows: errorRows.slice(0, 50), // Limit to first 50 errors
    })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    )
  }
}

