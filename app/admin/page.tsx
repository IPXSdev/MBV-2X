import { getCurrentUser } from "@/lib/supabase/auth"
import { AdminPortal } from "@/components/admin/admin-portal"
import { redirect } from "next/navigation"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "admin" && user.role !== "master_dev")) {
    redirect("/login")
  }

  return <AdminPortal />
}
