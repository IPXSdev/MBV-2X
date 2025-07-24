"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { DevToolbar } from "@/components/admin/dev-toolbar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check if user should see dev toolbar (admin/master_dev with specific emails)
  const shouldShowDevToolbar =
    (user.role === "admin" || user.role === "master_dev") &&
    (user.email.includes("2668") || user.email.includes("ipxs"))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent user={user} loading={loading} />
      {shouldShowDevToolbar && <DevToolbar />}
    </div>
  )
}
