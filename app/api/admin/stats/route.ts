import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Use custom auth system
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or master dev
    if (user.role !== "admin" && user.role !== "master_dev") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Use service client for database operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get various statistics
    const [
      { count: totalUsers },
      { count: totalSubmissions },
      { count: pendingSubmissions },
      { count: approvedSubmissions },
      { count: rejectedSubmissions },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("submissions").select("*", { count: "exact", head: true }),
      supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    ])

    // Get user tier distribution
    const { data: tierStats } = await supabase
      .from("users")
      .select("tier")
      .then(({ data }) => {
        const stats = { creator: 0, indie: 0, pro: 0 }
        data?.forEach((user) => {
          if (user.tier in stats) {
            stats[user.tier as keyof typeof stats]++
          }
        })
        return { data: stats }
      })

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: recentSubmissions } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString())

    const { count: recentUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString())

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers || 0,
          recent: recentUsers || 0,
          byTier: tierStats || { creator: 0, indie: 0, pro: 0 },
        },
        submissions: {
          total: totalSubmissions || 0,
          pending: pendingSubmissions || 0,
          approved: approvedSubmissions || 0,
          rejected: rejectedSubmissions || 0,
          recent: recentSubmissions || 0,
        },
      },
    })
  } catch (error) {
    console.error("Error in admin stats route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
