import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const submissionId = params.id
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the submission to check ownership and status
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .eq("user_id", session.user.id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Only pending submissions can be deleted
    if (submission.status !== "pending") {
      return NextResponse.json({ error: "Only pending submissions can be deleted" }, { status: 403 })
    }

    // Delete the submission
    const { error: deleteError } = await supabase
      .from("submissions")
      .delete()
      .eq("id", submissionId)
      .eq("user_id", session.user.id)

    if (deleteError) {
      throw deleteError
    }

    // Get user data to check tier
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("tier, submission_credits")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      // Continue anyway, the submission is already deleted
    } else if (userData && userData.tier !== "pro") {
      // Refund credit if not pro tier
      const { error: creditError } = await supabase
        .from("users")
        .update({ submission_credits: userData.submission_credits + 1 })
        .eq("id", session.user.id)

      if (creditError) {
        console.error("Error refunding credit:", creditError)
        // Continue anyway, the submission is already deleted
      }
    }

    // Delete the file from storage
    // Extract the path from the URL
    const fileUrl = submission.file_url
    const storageUrl = supabase.storage.from("audio").getPublicUrl("").data.publicUrl
    const filePath = fileUrl.replace(storageUrl, "")

    if (filePath) {
      const { error: storageError } = await supabase.storage.from("audio").remove([filePath])

      if (storageError) {
        console.error("Error deleting file:", storageError)
        // Continue anyway, the submission record is already deleted
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting submission:", error)
    return NextResponse.json({ error: error.message || "Failed to delete submission" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const submissionId = params.id
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the submission
    const { data: submission, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .eq("user_id", session.user.id)
      .single()

    if (error || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error: any) {
    console.error("Error fetching submission:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch submission" }, { status: 500 })
  }
}
