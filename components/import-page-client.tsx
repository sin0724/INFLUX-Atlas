'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Download, Plus } from 'lucide-react'
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
  
  // Single entry form state
  const [showSingleForm, setShowSingleForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    platform: 'instagram',
    handle: '',
    profileUrl: '',
    country: '',
    city: '',
    languages: '',
    followers: '',
    avgLikes: '',
    avgComments: '',
    avgShares: '',
    engagementRate: '',
    mainCategory: '',
    subCategories: '',
    collabTypes: '',
    basePriceText: '',
    contactEmail: '',
    contactDm: '',
    status: 'candidate',
    tags: '',
    notesSummary: '',
  })

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
    // 간소화된 템플릿 생성 (엑셀 형식)
    const headers = simplifiedFields.map((f) => f.label)
    
    // Create workbook
    const worksheet = XLSX.utils.aoa_to_sheet([headers])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '인플루언서')
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '인플루언서_등록_템플릿.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.platform) {
      alert('이름과 플랫폼은 필수 항목입니다')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        alert('인플루언서가 성공적으로 등록되었습니다')
        // Reset form
        setFormData({
          name: '',
          platform: 'instagram',
          handle: '',
          profileUrl: '',
          country: '',
          city: '',
          languages: '',
          followers: '',
          avgLikes: '',
          avgComments: '',
          avgShares: '',
          engagementRate: '',
          mainCategory: '',
          subCategories: '',
          collabTypes: '',
          basePriceText: '',
          contactEmail: '',
          contactDm: '',
          status: 'candidate',
          tags: '',
          notesSummary: '',
        })
        setShowSingleForm(false)
        // Optionally redirect to influencers page
        window.location.href = '/influencers'
      } else {
        const data = await res.json()
        alert(data.error || '등록에 실패했습니다')
      }
    } catch (error) {
      console.error('Error creating influencer:', error)
      alert('등록 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">인플루언서 데이터 임포트</h1>
          <Button
            onClick={() => setShowSingleForm(!showSingleForm)}
            variant={showSingleForm ? 'outline' : 'default'}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showSingleForm ? '파일 임포트로 전환' : '1명씩 등록'}
          </Button>
        </div>

        <div className="space-y-6">
          {showSingleForm ? (
            /* Single Entry Form */
            <Card>
              <CardHeader>
                <CardTitle>인플루언서 등록</CardTitle>
                <CardDescription>
                  인플루언서 정보를 직접 입력하여 등록하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">이름 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="platform">플랫폼 *</Label>
                      <select
                        id="platform"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        required
                      >
                        <option value="instagram">Instagram</option>
                        <option value="threads">Threads</option>
                        <option value="youtube">YouTube</option>
                        <option value="tiktok">TikTok</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="handle">핸들</Label>
                      <Input
                        id="handle"
                        value={formData.handle}
                        onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                        placeholder="자동 생성됩니다"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profileUrl">프로필 URL</Label>
                      <Input
                        id="profileUrl"
                        type="url"
                        value={formData.profileUrl}
                        onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">국가</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">도시</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="followers">팔로워</Label>
                      <Input
                        id="followers"
                        type="number"
                        value={formData.followers}
                        onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="avgLikes">평균 좋아요</Label>
                      <Input
                        id="avgLikes"
                        type="number"
                        value={formData.avgLikes}
                        onChange={(e) => setFormData({ ...formData, avgLikes: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="avgComments">평균 댓글</Label>
                      <Input
                        id="avgComments"
                        type="number"
                        value={formData.avgComments}
                        onChange={(e) => setFormData({ ...formData, avgComments: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="avgShares">평균 공유</Label>
                      <Input
                        id="avgShares"
                        type="number"
                        value={formData.avgShares}
                        onChange={(e) => setFormData({ ...formData, avgShares: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="engagementRate">참여율 (%)</Label>
                      <Input
                        id="engagementRate"
                        type="number"
                        step="0.01"
                        value={formData.engagementRate}
                        onChange={(e) => setFormData({ ...formData, engagementRate: e.target.value })}
                        placeholder="비워두면 자동 계산됩니다"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        비워두면 (좋아요 + 댓글 + 공유) / 팔로워 × 100으로 자동 계산됩니다
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="mainCategory">주요 카테고리</Label>
                      <Input
                        id="mainCategory"
                        value={formData.mainCategory}
                        onChange={(e) => setFormData({ ...formData, mainCategory: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">상태</Label>
                      <select
                        id="status"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="candidate">후보</option>
                        <option value="active">활성</option>
                        <option value="blacklist">블랙리스트</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">연락처 이메일</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactDm">연락처 DM</Label>
                      <Input
                        id="contactDm"
                        value={formData.contactDm}
                        onChange={(e) => setFormData({ ...formData, contactDm: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="collabTypes">협업 유형 (쉼표로 구분)</Label>
                    <Input
                      id="collabTypes"
                      value={formData.collabTypes}
                      onChange={(e) => setFormData({ ...formData, collabTypes: e.target.value })}
                      placeholder="예: 제품 리뷰, 언박싱, 브랜드 협찬"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="예: 뷰티, 패션, 라이프스타일"
                    />
                  </div>
                  <div>
                    <Label htmlFor="basePriceText">기본 가격</Label>
                    <Textarea
                      id="basePriceText"
                      value={formData.basePriceText}
                      onChange={(e) => setFormData({ ...formData, basePriceText: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notesSummary">메모 요약</Label>
                    <Textarea
                      id="notesSummary"
                      value={formData.notesSummary}
                      onChange={(e) => setFormData({ ...formData, notesSummary: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSingleForm(false)}
                    >
                      취소
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? '등록 중...' : '등록'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

