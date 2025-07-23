import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const filter = searchParams.get("filter") || "all" // all, ranked, unranked, my_ranked
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from("submissions").select(
      `
        id,
        title,
        artist_name,
        genre,
        mood_tags,
        file_url,
        file_size,
        status,
        admin_rating,
        admin_feedback,
        submitted_at,
        updated_at,
        credits_used,
        description,
        users (
          id,
          name,
          email,
          tier
        )
      `,
      { count: "exact" },
    )

    // Apply status filter if provided
    if (status) {
      query = query.eq("status", status)
    }

    // Apply ranking filter
    if (filter === "ranked") {
      query = query.not("admin_rating", "is", null)
    } else if (filter === "unranked") {
      query = query.is("admin_rating", null)
    } else if (filter === "my_ranked") {
      // This would require a join with a reviews table that tracks which admin reviewed which submission
      // For now, we'll just return all ranked submissions
      query = query.not("admin_rating", "is", null)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order("submitted_at", { ascending: false })

    const { data: submissions, error, count } = await query

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
    }

    return NextResponse.json({
      submissions: submissions || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    })
  } catch (error) {
    console.error("Error in admin submissions route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
