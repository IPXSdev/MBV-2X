import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
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
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Use service client for database operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "unranked"
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

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

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (filter === "ranked") {
      query = query.not("admin_rating", "is", null)
    } else if (filter === "unranked") {
      query = query.is("admin_rating", null)
    } else if (filter === "my_ranked") {
      query = query.eq("reviewed_by", user.id).not("admin_rating", "is", null)
    }

    // Get total count for pagination
    const { count } = await supabase.from("submissions").select("*", { count: "exact", head: true })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: submissions, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
    }

    return NextResponse.json({
      submissions: submissions || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Admin submissions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
