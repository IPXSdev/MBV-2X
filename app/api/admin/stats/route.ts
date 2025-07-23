import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function GET(request: NextRequest) {
  try {
    // Use the custom auth system
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or master dev
    if (!["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Use service client for database operations
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get submission stats
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("status, created_at")

    if (submissionsError) {
      console.error("Error fetching submission stats:", submissionsError)
    }

    // Get user stats
    const { data: users, error: usersError } = await supabase.from("users").select("role, tier, created_at")

    if (usersError) {
      console.error("Error fetching user stats:", usersError)
    }

    // Calculate submission stats
    const submissionStats = {
      total: submissions?.length || 0,
      pending: submissions?.filter((s) => s.status === "pending").length || 0,
      approved: submissions?.filter((s) => s.status === "approved").length || 0,
      rejected: submissions?.filter((s) => s.status === "rejected").length || 0,
      in_review: submissions?.filter((s) => s.status === "in_review").length || 0,
    }

    // Calculate user stats
    const userStats = {
      total: users?.length || 0,
      creator: users?.filter((u) => u.tier === "creator").length || 0,
      indie: users?.filter((u) => u.tier === "indie").length || 0,
      pro: users?.filter((u) => u.tier === "pro").length || 0,
      admins: users?.filter((u) => ["admin", "master_dev"].includes(u.role)).length || 0,
    }

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentSubmissions = submissions?.filter((s) => new Date(s.created_at) > thirtyDaysAgo).length || 0

    const recentUsers = users?.filter((u) => new Date(u.created_at) > thirtyDaysAgo).length || 0

    const activityStats = {
      recentSubmissions,
      recentUsers,
    }

    return NextResponse.json({
      submissions: submissionStats,
      users: userStats,
      activity: activityStats,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
