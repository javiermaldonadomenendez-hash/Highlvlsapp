export const dynamic = 'force-dynamic'

import { AdminPanel } from '@/components/AdminPanel'
import { getUsers, getTeams } from '@/lib/queries'

export default async function AdminPage() {
  const [users, teams] = await Promise.all([getUsers(), getTeams()])
  return <AdminPanel users={users} teams={teams} />
}
