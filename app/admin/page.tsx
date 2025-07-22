import { requireAdmin } from "@/lib/supabase/auth"
import { AdminPortal } from "@/components/admin/admin-portal"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const user = await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminPortal user={user} />
    </div>
  )
}
