import { redirect } from 'next/navigation'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { ImportPageClient } from '@/components/import-page-client'
import { Navbar } from '@/components/navbar'

export default async function ImportPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  try {
    await requireAdmin()
  } catch {
    redirect('/dashboard')
  }

  return (
    <>
      <Navbar />
      <ImportPageClient />
    </>
  )
}

