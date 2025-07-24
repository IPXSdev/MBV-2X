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
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const search = searchParams.get("search")
    const tier = searchParams.get("tier")

    let query = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

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
        { status: 500 }
      )
    }

    // Get submission counts for each user
    const userIds = users?.map(u => u.id) || []
    const { data: submissionCounts } = await supabase
      .from("submissions")
      .select("user_id")
      .in("user_id", userIds)

    const submissionCountMap = submissionCounts?.reduce((acc, sub) => {
      acc[sub.user_id] = (acc[sub.user_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const usersWithCounts = users?.map(user => ({
      ...user,
      total_submissions: submissionCountMap[user.id] || 0,
    })) || []

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
      users: usersWithCounts,
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
      { status: 500 }
    )
  }
}
