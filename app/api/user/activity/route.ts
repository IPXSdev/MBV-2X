import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServiceClient()

    // Get recent submissions as activity
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("id, title, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10)

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
    }

    // Transform submissions into activity format
    const activity = (submissions || []).map((submission) => ({
      id: submission.id,
      type: "submission" as const,
      title: `Track "${submission.title}" ${submission.status}`,
      description: `Your submission has been ${submission.status.replace("_", " ")}`,
      timestamp: submission.updated_at,
      status: submission.status,
    }))

    // Add some sample achievements and upgrades for demo
    if (user.tier !== "creator") {
      activity.push({
        id: "upgrade-" + user.id,
        type: "upgrade" as const,
        title: `Upgraded to ${user.tier} tier`,
        description: `You now have access to ${user.tier} features and submission credits`,
        timestamp: user.updated_at,
        status: "completed",
      })
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Activity API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
