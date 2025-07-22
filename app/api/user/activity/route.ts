import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const supabase = createClient()

    // Get recent submissions as activity
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("id, title, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching user activity:", error)
      return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
    }

    // Transform submissions into activity format
    const activity =
      submissions?.map((submission) => ({
        id: submission.id,
        type: "submission",
        title: `Submitted "${submission.title}"`,
        status: submission.status,
        timestamp: submission.created_at,
      })) || []

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("User activity API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
