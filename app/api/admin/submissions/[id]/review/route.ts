import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { status, feedback, rating, tags } = await request.json()
    const submissionId = params.id

    // Update submission status
    const { error: submissionError } = await supabase
      .from("submissions")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)

    if (submissionError) {
      console.error("Error updating submission:", submissionError)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    // Create review record
    const { error: reviewError } = await supabase.from("reviews").insert({
      submission_id: submissionId,
      reviewer_id: admin.id,
      feedback,
      rating: rating || null,
      tags: tags || [],
      created_at: new Date().toISOString(),
    })

    if (reviewError) {
      console.error("Error creating review:", reviewError)
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Review submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
