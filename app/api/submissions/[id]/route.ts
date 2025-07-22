import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServiceClient()

    // Get submission - users can only access their own submissions unless they're admin
    const query = supabase.from("submissions").select("*").eq("id", params.id)

    if (user.role !== "admin") {
      query.eq("user_id", user.id)
    }

    const { data: submission, error } = await query.single()

    if (error) {
      console.error("Submission fetch error:", error)
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("Submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServiceClient()

    // Get submission to verify ownership and status
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id) // Users can only delete their own submissions
      .single()

    if (fetchError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Only allow deletion of pending submissions
    if (submission.status !== "pending") {
      return NextResponse.json({ error: "Only pending submissions can be deleted" }, { status: 400 })
    }

    // Delete the file from storage
    if (submission.file_url) {
      try {
        // Extract file path from URL
        const url = new URL(submission.file_url)
        const pathParts = url.pathname.split("/")
        const fileName = pathParts[pathParts.length - 1]
        const filePath = `${user.id}/${fileName}`

        await supabase.storage.from("submissions").remove([filePath])
      } catch (storageError) {
        console.error("Storage deletion error:", storageError)
        // Continue with submission deletion even if file deletion fails
      }
    }

    // Delete submission record
    const { error: deleteError } = await supabase
      .from("submissions")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Submission deletion error:", deleteError)
      return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 })
    }

    // Refund submission credit for pending submissions (unless unlimited)
    if (user.submission_credits !== 999999) {
      const { error: creditError } = await supabase
        .from("users")
        .update({
          submission_credits: user.submission_credits + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (creditError) {
        console.error("Credit refund error:", creditError)
        // Don't fail the deletion if credit refund fails, just log it
      }
    }

    // Log activity
    try {
      await supabase.from("user_activity").insert({
        user_id: user.id,
        type: "submission_deleted",
        title: "Submission Deleted",
        description: `Deleted "${submission.title}" by ${submission.artist_name}`,
        metadata: {
          submission_id: submission.id,
          refunded_credit: user.submission_credits !== 999999,
        },
      })
    } catch (error) {
      console.error("Activity logging error:", error)
      // Don't fail deletion if activity logging fails
    }

    return NextResponse.json({ success: true, message: "Submission deleted successfully" })
  } catch (error) {
    console.error("Delete submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
