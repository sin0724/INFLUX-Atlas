'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface ColumnMapping {
  [dbField: string]: string // dbField -> uploaded column name
}

export function ImportPageClient() {
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    total: number
    success: number
    errors: number
    errorRows: any[]
  } | null>(null)

  // 간소화된 필드 정의
  const simplifiedFields = [
    { key: 'name', label: '이름', required: true },
    { key: 'platform', label: '플랫폼', required: true },
    { key: 'profileUrl', label: '프로필URL', required: false },
    { key: 'country', label: '국가', required: false },
    { key: 'followers', label: '팔로워', required: false },
    { key: 'avgLikes', label: '평균좋아요', required: false },
    { key: 'avgComments', label: '평균댓글', required: false },
    { key: 'avgShares', label: '평균공유수', required: false },
    { key: 'engagementRate', label: '참여율', required: false },
    { key: 'mainCategory', label: '카테고리', required: false },
    { key: 'collabTypes', label: '협업유형', required: false },
    { key: 'basePriceText', label: '단가', required: false },
    { key: 'contactEmail', label: '연락처', required: false },
    { key: 'notesSummary', label: '메모', required: false },
  ]

  // 한글 컬럼명을 DB 필드로 자동 매핑
  const autoMapColumns = (columns: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {}
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
      if (fieldMap[trimmedCol]) {
        mapping[fieldMap[trimmedCol]] = trimmedCol
      }
    })

    return mapping
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setRawData([])
    setColumns([])
    setMapping({})
    setResult(null)
    setImporting(true)

    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase()

    try {
      let parsedData: any[] = []
      let parsedColumns: string[] = []

      if (fileExtension === 'csv') {
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              parsedColumns = Object.keys(results.data[0] as any)
              parsedData = results.data as any[]
              
              setColumns(parsedColumns)
              setRawData(parsedData)
              
              // 자동 매핑
              const autoMapping = autoMapColumns(parsedColumns)
              setMapping(autoMapping)
              
              // 바로 임포트 실행
              handleAutoImport(parsedData, autoMapping, uploadedFile)
            }
          },
          error: (error) => {
            console.error('CSV parse error:', error)
            alert('CSV 파일을 읽는 중 오류가 발생했습니다')
            setImporting(false)
          },
        })
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader()
        reader.onload = (e) => {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          if (jsonData.length > 0) {
            parsedColumns = Object.keys(jsonData[0] as any)
            parsedData = jsonData as any[]
            
            setColumns(parsedColumns)
            setRawData(parsedData)
            
            // 자동 매핑
            const autoMapping = autoMapColumns(parsedColumns)
            setMapping(autoMapping)
            
            // 바로 임포트 실행
            handleAutoImport(parsedData, autoMapping, uploadedFile)
          } else {
            setImporting(false)
          }
        }
        reader.readAsBinaryString(uploadedFile)
      } else {
        alert('지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일을 업로드하세요.')
        setImporting(false)
      }
    } catch (error) {
      console.error('Error reading file:', error)
      alert('파일을 읽는 중 오류가 발생했습니다')
      setImporting(false)
    }
  }

  const handleAutoImport = async (data: any[], mapping: ColumnMapping, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mapping', JSON.stringify(mapping))

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {
        setResult({
          total: result.total,
          success: result.success,
          errors: result.errors,
          errorRows: result.errorRows || [],
        })
      } else {
        alert(result.error || '임포트에 실패했습니다')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('데이터 임포트 중 오류가 발생했습니다')
    } finally {
      setImporting(false)
    }
  }


  const downloadTemplate = () => {
    // 간소화된 템플릿 생성
    const templateData = simplifiedFields.map((f) => f.label)
    const csv = templateData.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '인플루언서_등록_템플릿.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">인플루언서 데이터 임포트</h1>

        <div className="space-y-6">
          {/* Step 1: Download Template */}
          <Card>
            <CardHeader>
              <CardTitle>1단계: 템플릿 다운로드</CardTitle>
              <CardDescription>
                엑셀 양식을 다운로드하여 인플루언서 정보를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" disabled={importing}>
                <Download className="h-4 w-4 mr-2" />
                템플릿 다운로드
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Upload File */}
          <Card>
            <CardHeader>
              <CardTitle>2단계: 파일 업로드</CardTitle>
              <CardDescription>
                작성한 Excel (.xlsx) 또는 CSV 파일을 업로드하면 자동으로 등록됩니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <label 
                  htmlFor="file-upload" 
                  className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={importing}
                  />
                  <Upload className="h-4 w-4 mr-2" />
                  {importing ? '임포트 중...' : '파일 선택'}
                </label>
                {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
              </div>
              {importing && (
                <p className="text-sm text-muted-foreground mt-2">
                  파일을 업로드하고 있습니다...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>임포트 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>전체 행:</strong> {result.total}
                  </p>
                  <p className="text-sm text-green-600">
                    <strong>성공적으로 임포트됨:</strong> {result.success}
                  </p>
                  <p className="text-sm text-destructive">
                    <strong>오류:</strong> {result.errors}
                  </p>
                </div>
                {result.errorRows.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">오류 상세:</p>
                    <div className="max-h-60 overflow-y-auto">
                      {result.errorRows.map((error, index) => (
                        <div key={index} className="p-2 bg-destructive/10 rounded mb-2 text-sm">
                          {error.rowIndex + 1}행: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

