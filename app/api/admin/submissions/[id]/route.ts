import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const submissionId = params.id

    // First delete related records
    await supabase.from("reviews").delete().eq("submission_id", submissionId)

    // Then delete the submission
    const { error } = await supabase.from("submissions").delete().eq("id", submissionId)

    if (error) {
      console.error("Error deleting submission:", error)
      return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const submissionId = params.id

    const { data: submission, error } = await supabase
      .from("submissions")
      .select(`
        *,
        users!inner(name, email),
        tracks!inner(title, artist, duration, file_url),
        reviews(*)
      `)
      .eq("id", submissionId)
      .single()

    if (error) {
      console.error("Error fetching submission:", error)
      return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("Get submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
