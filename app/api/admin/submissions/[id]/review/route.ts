import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/auth"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use custom auth system
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or master dev
    if (user.role !== "admin" && user.role !== "master_dev") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const submissionId = params.id
    const body = await request.json()

    // Validate input
    const { rating, feedback, status, mood_tags } = body

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    if (status && !["pending", "in_review", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Use service client for database operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Update submission
    const updateData: any = {
      updated_at: new Date().toISOString(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }

    if (rating) updateData.admin_rating = rating
    if (feedback) updateData.admin_feedback = feedback
    if (status) updateData.status = status
    if (mood_tags) updateData.mood_tags = mood_tags

    const { data: submission, error } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("id", submissionId)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      submission,
      message: "Review submitted successfully",
    })
  } catch (error) {
    console.error("Review submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
