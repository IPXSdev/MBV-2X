import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user || !["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submissionId = params.id
    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { rating, feedback, status, tags } = body

    if (!rating || !status) {
      return NextResponse.json({ error: "Rating and status are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // First, check if the submission exists
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("id, user_id, title, status")
      .eq("id", submissionId)
      .single()

    if (fetchError || !submission) {
      console.error("Error fetching submission:", fetchError)
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Update the submission with review data
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        admin_rating: rating,
        admin_feedback: feedback,
        status: status,
        mood_tags: tags || submission.mood_tags,
        updated_at: new Date().toISOString(),
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId)

    if (updateError) {
      console.error("Error updating submission:", updateError)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    // Log activity for the user
    await supabase.from("activity").insert({
      user_id: submission.user_id,
      type: "review",
      title: `Track review: ${submission.title}`,
      description: `Your track "${submission.title}" has been reviewed`,
      timestamp: new Date().toISOString(),
      status: status,
      metadata: {
        submission_id: submissionId,
        rating: rating,
        feedback: feedback,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Submission reviewed successfully",
    })
  } catch (error) {
    console.error("Error in review submission route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
