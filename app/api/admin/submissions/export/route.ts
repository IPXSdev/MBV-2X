export const dynamic = "force-dynamic"

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

    // Build query
    let query = supabase
      .from("submissions")
      .select(`
      id,
      track_title,
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
      users:user_id (name, email, tier)
    `)
      .order("submitted_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`track_title.ilike.%${search}%,artist_name.ilike.%${search}%,users.name.ilike.%${search}%`)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error("Error fetching submissions for export:", error)
      return NextResponse.json({ error: "Failed to export submissions" }, { status: 500 })
    }

    // Transform data for CSV
    const csvData = submissions?.map((submission) => ({
      ID: submission.id,
      Title: submission.track_title,
      Artist: submission.artist_name,
      Genre: submission.genre,
      "Mood Tags": submission.mood_tags?.join(", ") || "",
      Status: submission.status,
      Rating: submission.admin_rating || "",
      "Submitted By": submission.users?.name || "",
      Email: submission.users?.email || "",
      "User Tier": submission.users?.tier || "",
      "Submitted At": new Date(submission.submitted_at).toLocaleString(),
      "Updated At": submission.updated_at ? new Date(submission.updated_at).toLocaleString() : "",
      "File URL": submission.file_url,
      "File Size (MB)": submission.file_size || "",
    }))

    // Convert to CSV
    const headers = Object.keys(csvData?.[0] || {})
    const csvRows = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes
            return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
          })
          .join(","),
      ),
    ]
    const csv = csvRows.join("\n")

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="submissions-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export submissions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
