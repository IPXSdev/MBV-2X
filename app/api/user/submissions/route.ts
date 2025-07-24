import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching user submissions...")

    // Use custom auth system
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ No authenticated user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.email)

    // Use service client for database operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log(`📊 Fetching submissions for user ${user.id} with limit ${limit}, offset ${offset}`)

    // Fetch user's submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (submissionsError) {
      console.error("❌ Error fetching user submissions:", submissionsError)
      return NextResponse.json(
        {
          error: "Failed to fetch submissions",
          details: submissionsError.message,
        },
        { status: 500 },
      )
    }

    console.log(`✅ Found ${submissions?.length || 0} submissions for user`)

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      console.error("⚠️ Error getting submissions count:", countError)
    }

    console.log(`📈 Total submissions count: ${count || 0}`)

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error("❌ Error in user submissions route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
