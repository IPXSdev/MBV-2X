import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: submissions, error } = await supabase
      .from("submissions")
      .select(`
        *,
        users!inner(name, email),
        tracks!inner(title, artist, duration, file_url)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions for export:", error)
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
    }

    // Create CSV content
    const headers = [
      "ID",
      "Title",
      "Artist",
      "Status",
      "Submitter Name",
      "Submitter Email",
      "Duration",
      "Created At",
      "Updated At",
      "File URL",
    ]

    const csvRows = [
      headers.join(","),
      ...submissions.map((sub) =>
        [
          sub.id,
          `"${sub.tracks.title}"`,
          `"${sub.tracks.artist}"`,
          sub.status,
          `"${sub.users.name}"`,
          sub.users.email,
          sub.tracks.duration,
          sub.created_at,
          sub.updated_at,
          sub.tracks.file_url,
        ].join(","),
      ),
    ]

    const csvContent = csvRows.join("\n")

    return new NextResponse(csvContent, {
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
