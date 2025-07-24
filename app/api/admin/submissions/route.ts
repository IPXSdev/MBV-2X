import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "master_dev") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const supabase = await createServiceClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

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

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: submissions, error: submissionsError } = await query

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
      return NextResponse.json(
        {
          error: "Failed to fetch submissions",
          details: submissionsError.message,
        },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase.from("submissions").select("*", { count: "exact", head: true })

    if (status && status !== "all") {
      countQuery = countQuery.eq("status", status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error("Error getting submissions count:", countError)
    }

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
    console.error("Error in admin submissions route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
