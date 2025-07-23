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
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { status, feedback, rating } = body

    // Validate required fields
    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status",
          message: "Status must be 'approved', 'rejected', or 'pending'",
        },
        { status: 400 },
      )
    }

    // Use service client for database operations
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Update submission with review
    const { data: submission, error: updateError } = await supabase
      .from("submissions")
      .update({
        status,
        feedback: feedback || null,
        rating: rating || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
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
      return NextResponse.json(
        {
          error: "Failed to update submission",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    if (!submission) {
      return NextResponse.json(
        {
          error: "Submission not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      submission,
      message: `Submission ${status} successfully`,
    })
  } catch (error) {
    console.error("Error in submission review route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
