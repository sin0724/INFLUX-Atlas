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
        // 매핑 파싱 실패 시 서버에서 자동 생성
        mapping = {}
      }
    }

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
      
      // CSV 파일의 경우에도 서버 측 자동 매핑
      if (rawData.length > 0) {
        const actualColumns = Object.keys(rawData[0] as any).map(k => String(k).trim())
        if (Object.keys(mapping).length === 0 || !mapping.name || !mapping.platform) {
          const serverMapping = autoMapColumnsServer(actualColumns)
          mapping = { ...serverMapping, ...mapping }
        }
      }
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellText: false, cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // 첫 번째 행을 헤더로 사용하여 JSON으로 변환 (defval: ''로 빈 셀은 빈 문자열로 처리)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        raw: false,
        blankrows: false
      }) as any[]
      
      if (jsonData.length === 0) {
        return NextResponse.json({ error: 'Empty worksheet' }, { status: 400 })
      }
      
      // 첫 번째 행의 키를 헤더로 사용 (실제 데이터는 2행부터)
      const headers = Object.keys(jsonData[0] || {})
      rawData = jsonData.map(row => {
        const rowData: any = {}
        headers.forEach(header => {
          const value = row[header]
          rowData[header] = value !== undefined && value !== null ? String(value).trim() : ''
        })
        return rowData
      })
      
      console.log('Excel headers:', headers)
      console.log('Total data rows:', rawData.length)
      if (rawData.length > 0) {
        console.log('First data row keys:', Object.keys(rawData[0]))
        console.log('First data row sample:', JSON.stringify(rawData[0], null, 2))
      }
      
      // 서버 측 자동 매핑
      if (Object.keys(mapping).length === 0 || !mapping.name || !mapping.platform) {
        const serverMapping = autoMapColumnsServer(headers)
        mapping = { ...serverMapping, ...mapping }
        console.log('Server mapping result:', serverMapping)
        console.log('Final mapping:', mapping)
      }
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
      
      // 디버깅: 첫 번째 행의 매핑 정보 로그
      if (i === 0) {
        console.log('=== Import Debug Info ===')
        console.log('Mapping:', JSON.stringify(mapping, null, 2))
        console.log('Row keys:', Object.keys(row))
        console.log('Row data sample:', JSON.stringify({ ...row, ...Object.fromEntries(Object.keys(row).slice(0, 3).map(k => [k, row[k]])) }, null, 2))
        console.log('Name column in mapping:', mapping.name)
        console.log('Platform column in mapping:', mapping.platform)
      }

      // 필수 필드를 먼저 직접 찾아서 처리 (매핑이 안 되어 있을 경우 대비)
      const rowKeys = Object.keys(row)
      
      // 이름 필드 처리 - 모든 가능한 방법으로 찾기
      if (!influencerData.name) {
        const nameCandidates = [
          mapping.name,
          '이름',
          'name',
          'Name',
          'NAME'
        ].filter(Boolean)
        
        let nameValue: any = null
        for (const candidate of nameCandidates) {
          if (candidate && row[candidate] !== undefined && row[candidate] !== null && row[candidate] !== '') {
            nameValue = row[candidate]
            break
          }
        }
        
        // 정확히 일치하지 않으면 fuzzy matching
        if (!nameValue) {
          for (const key of rowKeys) {
            const normalizedKey = key.trim().toLowerCase()
            if (normalizedKey === '이름' || normalizedKey === 'name') {
              nameValue = row[key]
              if (nameValue && String(nameValue).trim()) break
            }
          }
        }
        
        if (nameValue && String(nameValue).trim()) {
          influencerData.name = String(nameValue).trim()
          if (i === 0) {
            console.log('Found name:', influencerData.name)
          }
        }
      }
      
      // 플랫폼 필드 처리 - 모든 가능한 방법으로 찾기
      if (!influencerData.platform) {
        const platformCandidates = [
          mapping.platform,
          '플랫폼',
          'platform',
          'Platform',
          'PLATFORM'
        ].filter(Boolean)
        
        let platformValue: any = null
        for (const candidate of platformCandidates) {
          if (candidate && row[candidate] !== undefined && row[candidate] !== null && row[candidate] !== '') {
            platformValue = row[candidate]
            break
          }
        }
        
        // 정확히 일치하지 않으면 fuzzy matching
        if (!platformValue) {
          for (const key of rowKeys) {
            const normalizedKey = key.trim().toLowerCase()
            if (normalizedKey === '플랫폼' || normalizedKey === 'platform') {
              platformValue = row[key]
              if (platformValue && String(platformValue).trim()) break
            }
          }
        }
        
        if (platformValue && String(platformValue).trim()) {
          const platformStr = String(platformValue).trim()
          const platformMap: Record<string, string> = {
            '인스타그램': 'instagram', '인스타': 'instagram', 'instagram': 'instagram',
            '유튜브': 'youtube', 'youtube': 'youtube',
            '틱톡': 'tiktok', '티크톡': 'tiktok', 'tiktok': 'tiktok',
            '스레드': 'threads', 'threads': 'threads',
            '기타': 'other', 'other': 'other',
          }
          const normalized = platformStr.toLowerCase()
          influencerData.platform = platformMap[platformStr] || platformMap[normalized] || normalized
          if (i === 0) {
            console.log('Found platform:', influencerData.platform, 'from:', platformStr)
          }
        }
      }

      // Map fields (선택 필드들은 값이 있으면 처리, 없으면 스킵)
      for (const [dbField, uploadedColumn] of Object.entries(mapping)) {
        // name, platform은 이미 위에서 처리했으므로 스킵
        if (dbField === 'name' || dbField === 'platform') {
          continue
        }
        
        if (!uploadedColumn) {
          continue
        }

        // 컬럼명이 정확히 일치하지 않을 수 있으므로 대소문자 및 공백 무시하여 매칭
        let value = row[uploadedColumn]
        
        // 정확히 일치하지 않으면 대소문자/공백 무시하여 찾기
        if (value === undefined || value === null) {
          const rowKeys = Object.keys(row)
          const matchedKey = rowKeys.find(key => 
            key.trim().toLowerCase() === uploadedColumn.trim().toLowerCase() ||
            key.trim().replace(/\s+/g, '') === uploadedColumn.trim().replace(/\s+/g, '')
          )
          if (matchedKey) {
            value = row[matchedKey]
            if (i === 0) {
              console.log(`Found column by fuzzy match: ${uploadedColumn} -> ${matchedKey}`)
            }
          }
        }
        
        // 값이 없으면 스킵 (선택 필드)
        if (value === null || value === undefined || value === '') {
          continue
        }

        const stringValue = String(value).trim()
        
        // 빈 문자열이면 스킵 (선택 필드)
        if (!stringValue || stringValue === '') {
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
            // 한글/영어 플랫폼명을 영어로 변환
            const trimmedPlatform = (stringValue && typeof stringValue === 'string') 
              ? stringValue.trim() 
              : ''
            
            if (!trimmedPlatform) {
              errors.push(`platform is required`)
              break
            }

            // 플랫폼 매핑 (한글은 원본 그대로, 영어는 소문자로)
            const platformMap: Record<string, string> = {
              // 한글
              '인스타그램': 'instagram',
              '인스타': 'instagram',
              '유튜브': 'youtube',
              '틱톡': 'tiktok',
              '티크톡': 'tiktok',
              '스레드': 'threads',
              '기타': 'other',
              // 영어 (소문자)
              'instagram': 'instagram',
              'youtube': 'youtube',
              'tiktok': 'tiktok',
              'threads': 'threads',
              'other': 'other',
              // 영어 (대문자 혼합)
              'Instagram': 'instagram',
              'YouTube': 'youtube',
              'TikTok': 'tiktok',
              'Threads': 'threads',
              'Other': 'other',
            }
            
            // 한글 플랫폼명은 원본 그대로 매핑 시도
            let mappedPlatform = platformMap[trimmedPlatform]
            
            // 매핑되지 않으면 소문자로 변환 후 다시 시도
            if (!mappedPlatform) {
              const lowerPlatform = trimmedPlatform.toLowerCase()
              mappedPlatform = platformMap[lowerPlatform] || lowerPlatform
            }
            
            // 최종 검증
            if (!['instagram', 'threads', 'youtube', 'tiktok', 'other'].includes(mappedPlatform)) {
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
            // 한국어 숫자 단위 파싱 시도 (예: "3.1만", "1.3천")
            const parsedNum = parseKoreanNumber(stringValue)
            if (parsedNum === null) {
              // 한국어 단위 파싱 실패 시 일반 숫자 파싱 시도
              const num = parseFloat(stringValue.replace(/,/g, ''))
              if (isNaN(num)) {
                errors.push(`${dbField} must be a number`)
              } else {
                influencerData[dbField] = Math.round(num)
              }
            } else {
              influencerData[dbField] = parsedNum
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

      // 필수 필드 검증: 이름과 플랫폼만 필수
      if (i === 0) {
        console.log('After mapping - influencerData.name:', influencerData.name)
        console.log('After mapping - influencerData.platform:', influencerData.platform)
      }
      
      // 이름 필수 검증
      if (!influencerData.name || typeof influencerData.name !== 'string' || influencerData.name.trim() === '') {
        errors.push('이름은 필수입니다')
      }
      
      // 플랫폼 필수 검증
      if (!influencerData.platform || typeof influencerData.platform !== 'string' || influencerData.platform.trim() === '') {
        errors.push('플랫폼은 필수입니다')
      }
      
      if (i === 0 && errors.length > 0) {
        console.log('First row errors:', errors)
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

