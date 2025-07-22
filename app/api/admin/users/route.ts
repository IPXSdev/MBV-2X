import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const role = searchParams.get("role")
    const tier = searchParams.get("tier")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase.from("users").select("*").order("created_at", { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role && role !== "all") {
      query = query.eq("role", role)
    }

    if (tier && tier !== "all") {
      query = query.eq("tier", tier)
    }

    const { data: users, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Get total count
    let countQuery = supabase.from("users").select("id", { count: "exact", head: true })

    if (role && role !== "all") {
      countQuery = countQuery.eq("role", role)
    }

    if (tier && tier !== "all") {
      countQuery = countQuery.eq("tier", tier)
    }

    const { count } = await countQuery

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
