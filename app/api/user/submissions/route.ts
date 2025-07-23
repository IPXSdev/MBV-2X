import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function GET(request: NextRequest) {
  try {
    // Use the custom auth system
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Use service client for database operations
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get user's submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select(`
        id,
        title,
        artist_name,
        genre,
        status,
        admin_rating,
        admin_feedback,
        created_at,
        updated_at,
        file_url,
        mood_tags,
        description
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (submissionsError) {
      console.error("Error fetching user submissions:", submissionsError)
      return NextResponse.json(
        {
          error: "Failed to fetch submissions",
          details: submissionsError.message,
        },
        { status: 500 },
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      console.error("Count error:", countError)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      submissions: submissions || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error("User submissions error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
