import { getCurrentUser } from "@/lib/supabase/auth"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { redirect } from "next/navigation"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <DashboardContent />
}
