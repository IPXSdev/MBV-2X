import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const submissionId = params.id
    const body = await request.json()

    // Validate input
    const { rating, feedback, status } = body

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const validStatuses = ["pending", "in_review", "approved", "rejected"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Use service client for database operations
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if submission exists
    const { data: existingSubmission, error: fetchError } = await supabase
      .from("submissions")
      .select("id, user_id, title")
      .eq("id", submissionId)
      .single()

    if (fetchError || !existingSubmission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (rating !== undefined) {
      updateData.admin_rating = rating
      updateData.reviewed_by = user.id
    }

    if (feedback !== undefined) {
      updateData.admin_feedback = feedback
    }

    if (status) {
      updateData.status = status
    }

    // Update the submission
    const { data: updatedSubmission, error: updateError } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("id", submissionId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating submission:", updateError)
      return NextResponse.json(
        {
          error: "Failed to update submission",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Submission reviewed successfully",
      submission: updatedSubmission,
    })
  } catch (error) {
    console.error("Review submission error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
