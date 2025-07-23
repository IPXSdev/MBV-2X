import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or master dev
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || !userData || !["admin", "master_dev"].includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = supabase.from("submissions").select(`
        *,
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

    if (status) {
      query = query.eq("status", status)
    }

    // Get total count for pagination
    const { count } = await supabase.from("submissions").select("*", { count: "exact", head: true })

    // Apply pagination and ordering
    const { data: submissions, error: submissionsError } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
