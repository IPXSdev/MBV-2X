import { requireAuth } from "@/lib/supabase/auth"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const user = await requireAuth()

  return <DashboardContent user={user} />
}
