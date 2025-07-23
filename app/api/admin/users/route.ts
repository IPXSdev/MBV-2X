import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Use the custom auth system
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or master dev
    if (!["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Use service client for database operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Get users with submission counts
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        name,
        role,
        tier,
        submission_credits,
        created_at,
        updated_at,
        is_verified
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

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

    // Get submission counts for each user
    const userIds = users?.map((u) => u.id) || []
    const { data: submissionCounts } = await supabase.from("submissions").select("user_id").in("user_id", userIds)

    // Count submissions per user
    const submissionCountMap =
      submissionCounts?.reduce(
        (acc, sub) => {
          acc[sub.user_id] = (acc[sub.user_id] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    // Add submission counts to users
    const usersWithCounts =
      users?.map((user) => ({
        ...user,
        total_submissions: submissionCountMap[user.id] || 0,
      })) || []

    // Get total count for pagination
    const { count } = await supabase.from("users").select("*", { count: "exact", head: true })

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      users: usersWithCounts,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
