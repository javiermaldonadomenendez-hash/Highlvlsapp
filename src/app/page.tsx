export const dynamic = 'force-dynamic'

import { AppProvider } from '@/lib/store'
import { AppRoot } from '@/components/AppRoot'
import { getUsers, getTeams } from '@/lib/queries'
import type { User, Team } from '@/types'

export default async function Home() {
  const [users, teams]: [User[], Team[]] = await Promise.all([getUsers(), getTeams()])

  return (
    <AppProvider>
      <AppRoot users={users} teams={teams} />
    </AppProvider>
  )
}
