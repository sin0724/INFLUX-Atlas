import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { influencers, importBatches, importErrors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// 한국어 숫자 단위 파싱 함수 (예: "3.1만" → 31000, "1.3천" → 1300)
function parseKoreanNumber(value: string): number | null {
  if (!value || typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim().replace(/,/g, '') // 쉼표 제거
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

// 서버 측 컬럼명 매핑 (클라이언트와 동일한 로직)
function autoMapColumnsServer(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const fieldMap: Record<string, string> = {
    '이름': 'name',
    '플랫폼': 'platform',
    '프로필URL': 'profileUrl',
    '프로필 URL': 'profileUrl',
    '프로필url': 'profileUrl',
    '국가': 'country',
    '팔로워': 'followers',
    '평균좋아요': 'avgLikes',
    '평균 좋아요': 'avgLikes',
    '평균댓글': 'avgComments',
    '평균 댓글': 'avgComments',
    '평균공유수': 'avgShares',
    '평균 공유수': 'avgShares',
    '평균공유': 'avgShares',
    '참여율': 'engagementRate',
    '카테고리': 'mainCategory',
    '협업유형': 'collabTypes',
    '협업 유형': 'collabTypes',
    '단가': 'basePriceText',
    '연락처': 'contactEmail',
    '메모': 'notesSummary',
  }

  columns.forEach((col) => {
    const trimmedCol = col.trim()
    // 정확히 일치하는 경우
    if (fieldMap[trimmedCol]) {
      mapping[fieldMap[trimmedCol]] = trimmedCol
      return
    }
    
    // 공백 제거 후 매핑 시도
    const noSpacesCol = trimmedCol.replace(/\s+/g, '')
    if (fieldMap[noSpacesCol]) {
      mapping[fieldMap[noSpacesCol]] = trimmedCol
      return
    }
    
    // 대소문자 무시 매핑 시도 (영어 컬럼명용)
    const lowerCol = trimmedCol.toLowerCase()
    const matchedKey = Object.keys(fieldMap).find(key => key.toLowerCase() === lowerCol)
    if (matchedKey) {
      mapping[fieldMap[matchedKey]] = trimmedCol
    }
  })

  return mapping
}

// 행에서 필드 값을 안전하게 추출하는 함수
function getFieldValue(row: any, fieldName: string, alternatives: string[]): string | null {
  // 정확히 일치하는 키 확인
  if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
    const value = String(row[fieldName]).trim()
    if (value) return value
  }
  
  // 대안 키들 확인
  for (const alt of alternatives) {
    if (row[alt] !== undefined && row[alt] !== null && row[alt] !== '') {
      const value = String(row[alt]).trim()
      if (value) return value
    }
  }
  
  // Fuzzy matching: 대소문자 무시, 공백 무시
  const rowKeys = Object.keys(row)
  for (const key of rowKeys) {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '')
    const normalizedField = fieldName.trim().toLowerCase().replace(/\s+/g, '')
    
    if (normalizedKey === normalizedField) {
      const value = row[key]
      if (value !== undefined && value !== null && value !== '') {
        const strValue = String(value).trim()
        if (strValue) return strValue
      }
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappingJson = formData.get('mapping') as string
    let mapping: Record<string, string> = {}
    
    // 클라이언트에서 전달된 매핑이 있으면 사용, 없으면 서버에서 자동 생성
    if (mappingJson) {
      try {
        mapping = JSON.parse(mappingJson)
      } catch (e) {
        mapping = {}
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Parse file
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    let rawData: any[] = []
    let headers: string[] = []

    if (fileExtension === 'csv') {
      const text = await file.text()
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      })
      rawData = result.data as any[]
      
      if (rawData.length > 0) {
        headers = Object.keys(rawData[0] as any).map(k => String(k).trim())
        const serverMapping = autoMapColumnsServer(headers)
        mapping = { ...serverMapping, ...mapping }
      }
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // sheet_to_json을 사용하여 파싱 (첫 번째 행이 헤더)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        raw: false,
        blankrows: false
      }) as any[]
      
      if (jsonData.length === 0) {
        return NextResponse.json({ error: 'Empty worksheet' }, { status: 400 })
      }
      
      // 헤더 추출
      headers = Object.keys(jsonData[0] || {})
      
      // 데이터 정리 (빈 값 처리)
      rawData = jsonData.map((row, index) => {
        const rowData: any = {}
        headers.forEach(header => {
          const value = row[header]
          rowData[header] = value !== undefined && value !== null ? String(value).trim() : ''
        })
        return rowData
      })
      
      // 서버 측 자동 매핑
      const serverMapping = autoMapColumnsServer(headers)
      mapping = { ...serverMapping, ...mapping }
      
      console.log('=== Excel Import Debug ===')
      console.log('Headers found:', headers)
      console.log('Mapping result:', mapping)
      console.log('First row data:', rawData[0])
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 })
    }

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'No data rows found' }, { status: 400 })
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
      
      // 디버깅: 첫 번째 행의 데이터 확인
      if (i === 0) {
        console.log('=== Row Processing Debug ===')
        console.log('Row keys:', Object.keys(row))
        console.log('Row object:', JSON.stringify(row, null, 2))
        console.log('Mapping.name:', mapping.name)
        console.log('Mapping.platform:', mapping.platform)
        console.log('Direct row["이름"]:', row['이름'])
        console.log('Direct row["플랫폼"]:', row['플랫폼'])
      }
      
      // 이름 추출: 먼저 row 객체의 키를 직접 확인
      let nameValue: string | null = null
      const rowKeys = Object.keys(row)
      
      // 1. 매핑된 컬럼명으로 직접 확인
      if (mapping.name && row[mapping.name] !== undefined && row[mapping.name] !== null && String(row[mapping.name]).trim()) {
        nameValue = String(row[mapping.name]).trim()
      }
      
      // 2. "이름"으로 직접 확인
      if (!nameValue && row['이름'] !== undefined && row['이름'] !== null && String(row['이름']).trim()) {
        nameValue = String(row['이름']).trim()
      }
      
      // 3. 모든 키에서 "이름" 찾기 (대소문자/공백 무시)
      if (!nameValue) {
        for (const key of rowKeys) {
          const normalizedKey = key.trim().replace(/\s+/g, '').toLowerCase()
          if (normalizedKey === '이름' || normalizedKey === 'name') {
            const val = row[key]
            if (val !== undefined && val !== null && String(val).trim()) {
              nameValue = String(val).trim()
              break
            }
          }
        }
      }
      
      if (nameValue) {
        influencerData.name = nameValue
        if (i === 0) console.log('Found name:', nameValue)
      } else {
        errors.push('이름은 필수입니다')
        if (i === 0) console.log('Name not found. Available keys:', rowKeys)
      }
      
      // 플랫폼 추출: 먼저 row 객체의 키를 직접 확인
      let platformValue: string | null = null
      
      // 1. 매핑된 컬럼명으로 직접 확인
      if (mapping.platform && row[mapping.platform] !== undefined && row[mapping.platform] !== null && String(row[mapping.platform]).trim()) {
        platformValue = String(row[mapping.platform]).trim()
      }
      
      // 2. "플랫폼"으로 직접 확인
      if (!platformValue && row['플랫폼'] !== undefined && row['플랫폼'] !== null && String(row['플랫폼']).trim()) {
        platformValue = String(row['플랫폼']).trim()
      }
      
      // 3. 모든 키에서 "플랫폼" 찾기 (대소문자/공백 무시)
      if (!platformValue) {
        for (const key of rowKeys) {
          const normalizedKey = key.trim().replace(/\s+/g, '').toLowerCase()
          if (normalizedKey === '플랫폼' || normalizedKey === 'platform') {
            const val = row[key]
            if (val !== undefined && val !== null && String(val).trim()) {
              platformValue = String(val).trim()
              break
            }
          }
        }
      }
      
      if (platformValue) {
        // 플랫폼 매핑 (한글/영어 → 영어 소문자)
        const platformMap: Record<string, string> = {
          '인스타그램': 'instagram', '인스타': 'instagram', 'instagram': 'instagram',
          '유튜브': 'youtube', 'youtube': 'youtube',
          '틱톡': 'tiktok', '티크톡': 'tiktok', 'tiktok': 'tiktok',
          '스레드': 'threads', 'threads': 'threads',
          '기타': 'other', 'other': 'other',
        }
        const normalized = platformValue.toLowerCase()
        influencerData.platform = platformMap[platformValue] || platformMap[normalized] || normalized
        if (i === 0) console.log('Found platform:', platformValue, '->', influencerData.platform)
      } else {
        errors.push('플랫폼은 필수입니다')
        if (i === 0) console.log('Platform not found. Available keys:', rowKeys)
      }
      
      // 필수 필드 검증
      if (!influencerData.name || !influencerData.platform) {
        errorRows.push({
          rowIndex: i,
          message: errors.join('; '),
          rawData: row,
        })
        await db.insert(importErrors).values({
          batchId: batch.id,
          rowIndex: i,
          errorMessage: errors.join('; '),
          rawData: row as any,
        })
        continue
      }
      
      // 선택 필드 처리
      const fieldMappings: Array<{dbField: string, alternatives: string[]}> = [
        { dbField: 'profileUrl', alternatives: ['프로필URL', '프로필 URL', 'profileUrl', 'profile_url'] },
        { dbField: 'country', alternatives: ['국가', 'country'] },
        { dbField: 'city', alternatives: ['도시', 'city'] },
        { dbField: 'mainCategory', alternatives: ['카테고리', 'mainCategory', 'category'] },
        { dbField: 'basePriceText', alternatives: ['단가', 'basePriceText', 'price'] },
        { dbField: 'contactEmail', alternatives: ['연락처', 'contactEmail', 'email'] },
        { dbField: 'contactDm', alternatives: ['DM', 'contactDm', 'dm'] },
        { dbField: 'notesSummary', alternatives: ['메모', 'notesSummary', 'notes', 'memo'] },
        { dbField: 'collabTypes', alternatives: ['협업유형', '협업 유형', 'collabTypes'] },
        { dbField: 'tags', alternatives: ['태그', 'tags'] },
        { dbField: 'languages', alternatives: ['언어', 'languages', 'lang'] },
        { dbField: 'subCategories', alternatives: ['하위카테고리', 'subCategories'] },
      ]
      
      for (const { dbField, alternatives } of fieldMappings) {
        const mappedCol = mapping[dbField]
        const value = getFieldValue(row, mappedCol || alternatives[0], alternatives)
        if (value) {
          influencerData[dbField] = value
        }
      }
      
      // 숫자 필드 처리
      const numberFields: Array<{dbField: string, alternatives: string[]}> = [
        { dbField: 'followers', alternatives: ['팔로워', 'followers'] },
        { dbField: 'avgLikes', alternatives: ['평균좋아요', '평균 좋아요', 'avgLikes'] },
        { dbField: 'avgComments', alternatives: ['평균댓글', '평균 댓글', 'avgComments'] },
        { dbField: 'avgShares', alternatives: ['평균공유수', '평균 공유수', 'avgShares'] },
      ]
      
      for (const { dbField, alternatives } of numberFields) {
        const mappedCol = mapping[dbField]
        const value = getFieldValue(row, mappedCol || alternatives[0], alternatives)
        if (value) {
          const parsedNum = parseKoreanNumber(value)
          if (parsedNum !== null) {
            influencerData[dbField] = parsedNum
          } else {
            const num = parseFloat(value.replace(/,/g, ''))
            if (!isNaN(num)) {
              influencerData[dbField] = Math.round(num)
            }
          }
        }
      }
      
      // 참여율 처리
      const engagementRateValue = getFieldValue(row, mapping.engagementRate || '참여율', ['참여율', 'engagementRate'])
      if (engagementRateValue) {
        const rate = parseFloat(engagementRateValue.replace(/,/g, ''))
        if (!isNaN(rate)) {
          influencerData.engagementRate = rate.toString()
        }
      }
      
      // 핸들 자동 생성
      if (!influencerData.handle) {
        if (influencerData.profileUrl) {
          try {
            const url = new URL(influencerData.profileUrl)
            const pathParts = url.pathname.split('/').filter(Boolean)
            if (pathParts.length > 0) {
              influencerData.handle = pathParts[pathParts.length - 1].replace('@', '')
            }
          } catch {
            // URL 파싱 실패 시 이름 기반
          }
        }
        if (!influencerData.handle && influencerData.name) {
          influencerData.handle = influencerData.name.toLowerCase().replace(/\s+/g, '') || 'user'
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
      
      // 배열 필드 처리 (쉼표/세미콜론으로 분리)
      const arrayFields = ['languages', 'subCategories', 'collabTypes', 'tags']
      for (const field of arrayFields) {
        if (influencerData[field] && typeof influencerData[field] === 'string') {
          influencerData[field] = influencerData[field]
            .split(/[,;]/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
      }
      
      // 기본값 설정
      if (!influencerData.status) {
        influencerData.status = 'candidate'
      }
      
      // 데이터베이스에 저장
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
