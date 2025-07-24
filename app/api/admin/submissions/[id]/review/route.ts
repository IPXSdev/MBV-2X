import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user || !["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submissionId = params.id
    const body = await request.json()
    const { status, rating, feedback, moodTags } = body

    // Validate required fields
    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (rating !== undefined && (rating < 1 || rating > 10)) {
      return NextResponse.json({ error: "Rating must be between 1 and 10" }, { status: 400 })
    }

    const supabase = createClient()

    // First, verify the submission exists
    const { data: existingSubmission, error: fetchError } = await supabase
      .from("submissions")
      .select("id, user_id, status")
      .eq("id", submissionId)
      .single()

    if (fetchError || !existingSubmission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }

    if (rating !== undefined) {
      updateData.admin_rating = rating
    }

    if (feedback) {
      updateData.admin_feedback = feedback
    }

    if (moodTags && Array.isArray(moodTags)) {
      updateData.mood_tags = moodTags
    }

    // Update the submission
    const { data: updatedSubmission, error: updateError } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("id", submissionId)
      .select(`
        *,
        users!inner(
          id,
          username,
          email,
          tier,
          role
        )
      `)
      .single()

    if (updateError) {
      console.error("Error updating submission:", updateError)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    // If approved and rated highly, consider adding to media library
    if (status === "approved" && rating && rating >= 8) {
      try {
        // Get the submission details for potential media library addition
        const { data: submission } = await supabase.from("submissions").select("*").eq("id", submissionId).single()

        if (submission && submission.file_path) {
          // Create a media entry (this could be automated or flagged for manual review)
          const mediaData = {
            title: submission.track_title || "Untitled",
            artist: submission.artist_name || "Unknown Artist",
            file_path: submission.file_path,
            duration: submission.duration || 0,
            file_size: submission.file_size || 0,
            status: "pending_review", // Requires additional review for media library
            source: "submission",
            submission_id: submissionId,
            created_by: user.id,
            created_at: new Date().toISOString(),
          }

          // This would add to a media_library table if it exists
          // For now, we'll just log it as a potential addition
          console.log("High-rated submission flagged for media library:", mediaData)
        }
      } catch (mediaError) {
        console.error("Error processing media library addition:", mediaError)
        // Don't fail the review if media library processing fails
      }
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: `Submission ${status} successfully`,
    })
  } catch (error) {
    console.error("Submission review error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user || !["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submissionId = params.id
    const supabase = createClient()

    const { data: submission, error } = await supabase
      .from("submissions")
      .select(`
        *,
        users!inner(
          id,
          username,
          email,
          tier,
          role,
          created_at as user_created_at
        )
      `)
      .eq("id", submissionId)
      .single()

    if (error || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Get the signed URL for the audio file if it exists
    let audioUrl = null
    if (submission.file_path) {
      const { data: signedUrl } = await supabase.storage
        .from("audio-submissions")
        .createSignedUrl(submission.file_path.replace("audio-submissions/", ""), 3600) // 1 hour expiry

      audioUrl = signedUrl?.signedUrl || null
    }

    return NextResponse.json({
      submission: {
        ...submission,
        audio_url: audioUrl,
      },
    })
  } catch (error) {
    console.error("Get submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
