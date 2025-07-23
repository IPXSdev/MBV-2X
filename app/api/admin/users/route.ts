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
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Use service client for database operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const search = searchParams.get("search")
    const tier = searchParams.get("tier")

    // Build query
    let query = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply tier filter if provided
    if (tier && tier !== "all") {
      query = query.eq("tier", tier)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json(
        {
          error: "Failed to fetch users",
          details: usersError.message,
        },
        { status: 500 },
      )
    }

    // Get total count for pagination
    let countQuery = supabase.from("users").select("*", { count: "exact", head: true })

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (tier && tier !== "all") {
      countQuery = countQuery.eq("tier", tier)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error("Error getting users count:", countError)
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error("Error in admin users route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
