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

    const { data: submissions, error } = await supabase
      .from("submissions")
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
    }

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Admin submissions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
