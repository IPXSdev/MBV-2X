import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or master dev
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, name")
      .eq("id", user.id)
      .single()

    if (userError || !userData || !["admin", "master_dev"].includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { rating, feedback, status, mood_tags } = body

    // Update the submission with review data
    const { data: submission, error: updateError } = await supabase
      .from("submissions")
      .update({
        admin_rating: rating || null,
        admin_feedback: feedback || null,
        status: status || "pending",
        mood_tags: mood_tags || [],
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          tier
        )
      `)
      .single()

    if (updateError) {
      console.error("Error updating submission:", updateError)
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
