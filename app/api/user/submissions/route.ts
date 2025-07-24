import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching user submissions...")

    // Get session token from cookies
    const sessionToken = request.cookies.get("session-token")?.value

    if (!sessionToken) {
      console.log("❌ No session token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get current user
    const user = await getCurrentUser(sessionToken)
    if (!user) {
      console.log("❌ Invalid session token")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.email)

    const supabase = createServiceClient()

    // Fetch user's submissions
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select(`
        id,
        title,
        artist_name,
        genre,
        description,
        audio_file_url,
        audio_file_name,
        audio_file_size,
        status,
        feedback,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Database error fetching submissions:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch submissions" }, { status: 500 })
    }

    console.log(`✅ Found ${submissions?.length || 0} submissions for user`)

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        submission_credits: user.submission_credits,
        tier: user.tier,
      },
    })
  } catch (error) {
    console.error("❌ Error in user submissions API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
