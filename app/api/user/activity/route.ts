import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get user activity
    const { data: activities, error } = await supabase
      .from("activity")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching activity:", error)
      return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
    }

    return NextResponse.json({ activities: activities || [] })
  } catch (error) {
    console.error("Error in activity route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
