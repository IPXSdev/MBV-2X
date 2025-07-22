import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase
      .from("submissions")
      .select(`
        *,
        users!inner(name, email),
        tracks!inner(title, artist, duration, file_url)
      `)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`tracks.title.ilike.%${search}%,tracks.artist.ilike.%${search}%,users.name.ilike.%${search}%`)
    }

    const { data: submissions, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
    }

    // Get total count
    let countQuery = supabase.from("submissions").select("id", { count: "exact", head: true })

    if (status && status !== "all") {
      countQuery = countQuery.eq("status", status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      submissions: submissions || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Admin submissions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
