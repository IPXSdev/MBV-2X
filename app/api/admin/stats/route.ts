import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const supabase = await createServiceClient()

    // Get submission stats
    const { data: submissions, error: submissionsError } = await supabase.from("submissions").select("status")

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
    }

    // Get user stats
    const { data: users, error: usersError } = await supabase.from("users").select("tier, role")

    if (usersError) {
      console.error("Error fetching users:", usersError)
    }

    // Calculate stats with fallbacks
    const submissionStats = {
      total: submissions?.length || 0,
      pending: submissions?.filter((s) => s.status === "pending").length || 0,
      approved: submissions?.filter((s) => s.status === "approved").length || 0,
      rejected: submissions?.filter((s) => s.status === "rejected").length || 0,
      in_review: submissions?.filter((s) => s.status === "in_review").length || 0,
    }

    const userStats = {
      total: users?.length || 0,
      creator: users?.filter((u) => u.tier === "creator").length || 0,
      indie: users?.filter((u) => u.tier === "indie").length || 0,
      pro: users?.filter((u) => u.tier === "pro").length || 0,
      admins: users?.filter((u) => u.role === "admin" || u.role === "master_dev").length || 0,
    }

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: recentSubmissions } = await supabase.from("submissions").select("id").gte("created_at", thirtyDaysAgo)

    const { data: recentUsers } = await supabase.from("users").select("id").gte("created_at", thirtyDaysAgo)

    const activityStats = {
      recentSubmissions: recentSubmissions?.length || 0,
      recentUsers: recentUsers?.length || 0,
    }

    return NextResponse.json({
      submissions: submissionStats,
      users: userStats,
      activity: activityStats,
    })
  } catch (error) {
    console.error("Admin stats API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
