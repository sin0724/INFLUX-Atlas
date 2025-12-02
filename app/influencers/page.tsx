import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { InfluencersList } from '@/components/influencers-list'
import { Navbar } from '@/components/navbar'

export default async function InfluencersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <Navbar />
      <InfluencersList />
    </>
  )
}

