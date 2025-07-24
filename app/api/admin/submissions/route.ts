import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const filter = searchParams.get("filter") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from("submissions")
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          tier
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter if provided
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Apply rating filter
    if (filter === "ranked") {
      query = query.not("admin_rating", "is", null)
    } else if (filter === "unranked") {
      query = query.is("admin_rating", null)
    } else if (filter === "my_ranked") {
      query = query.eq("reviewed_by", user.id).not("admin_rating", "is", null)
    }

    const { data: submissions, error: submissionsError } = await query

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

    // Get total count for pagination
    let countQuery = supabase.from("submissions").select("*", { count: "exact", head: true })

    if (status && status !== "all") {
      countQuery = countQuery.eq("status", status)
    }

    if (filter === "ranked") {
      countQuery = countQuery.not("admin_rating", "is", null)
    } else if (filter === "unranked") {
      countQuery = countQuery.is("admin_rating", null)
    } else if (filter === "my_ranked") {
      countQuery = countQuery.eq("reviewed_by", user.id).not("admin_rating", "is", null)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error("Error getting submissions count:", countError)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error("Error in admin submissions route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
