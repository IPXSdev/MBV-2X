import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function GET(request: NextRequest) {
  try {
    // Use the custom auth system instead of Supabase auth
    const user = await getCurrentUser()

    if (!user) {
      console.error("No authenticated user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or master dev
    if (!["admin", "master_dev"].includes(user.role)) {
      console.error("User role not authorized:", user.role)
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Use service client for database operations
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    let query = supabase.from("submissions").select(`
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
        file_size,
        mood_tags,
        description,
        user_id,
        reviewed_by,
        users:user_id (
          id,
          name,
          email,
          tier
        )
      `)

    // Apply filters
    if (filter === "ranked") {
      query = query.not("admin_rating", "is", null)
    } else if (filter === "unranked") {
      query = query.is("admin_rating", null)
    } else if (filter === "my_ranked") {
      query = query.eq("reviewed_by", user.id)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase.from("submissions").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Count error:", countError)
    }

    // Apply pagination and ordering
    const { data: submissions, error: submissionsError } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
      return NextResponse.json(
        {
          error: "Failed to fetch submissions",
          details: submissionsError.message,
        },
        { status: 500 },
      )
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
    console.error("Admin submissions error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
