import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.role !== "admin" && user.role !== "master_dev")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = createClient()

    // Get user stats
    const { data: users, error: usersError } = await supabase.from("users").select("id, tier, created_at")

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
    }

    // Get submission stats
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("id, status, created_at")

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
      return NextResponse.json({ error: "Failed to fetch submission stats" }, { status: 500 })
    }

    // Calculate stats
    const totalUsers = users?.length || 0
    const freeUsers = users?.filter((u) => u.tier === "free").length || 0
    const proUsers = users?.filter((u) => u.tier === "pro").length || 0
    const totalSubmissions = submissions?.length || 0
    const pendingSubmissions = submissions?.filter((s) => s.status === "pending").length || 0
    const approvedSubmissions = submissions?.filter((s) => s.status === "approved").length || 0
    const rejectedSubmissions = submissions?.filter((s) => s.status === "rejected").length || 0

    return NextResponse.json({
      users: {
        total: totalUsers,
        free: freeUsers,
        pro: proUsers,
      },
      submissions: {
        total: totalSubmissions,
        pending: pendingSubmissions,
        approved: approvedSubmissions,
        rejected: rejectedSubmissions,
      },
    })
  } catch (error) {
    console.error("Admin stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
