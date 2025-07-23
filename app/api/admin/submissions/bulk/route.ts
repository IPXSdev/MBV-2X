import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { action, submissionIds } = await request.json()

    if (!action || !submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    let result

    switch (action) {
      case "approve":
        result = await supabase
          .from("submissions")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .in("id", submissionIds)
        break
      case "reject":
        result = await supabase
          .from("submissions")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .in("id", submissionIds)
        break
      case "pending":
        result = await supabase
          .from("submissions")
          .update({ status: "pending", updated_at: new Date().toISOString() })
          .in("id", submissionIds)
        break
      case "in_review":
        result = await supabase
          .from("submissions")
          .update({ status: "in_review", updated_at: new Date().toISOString() })
          .in("id", submissionIds)
        break
      case "delete":
        // First delete related reviews
        await supabase.from("reviews").delete().in("submission_id", submissionIds)
        // Then delete submissions
        result = await supabase.from("submissions").delete().in("id", submissionIds)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (result.error) {
      console.error(`Error performing bulk ${action}:`, result.error)
      return NextResponse.json({ error: `Failed to perform bulk ${action}` }, { status: 500 })
    }

    // Create activity entries for affected submissions if not deleting
    if (action !== "delete") {
      // Get submission details
      const { data: submissions } = await supabase
        .from("submissions")
        .select("id, user_id, track_title")
        .in("id", submissionIds)

      if (submissions) {
        // Create activity entries
        const activities = submissions.map((submission) => ({
          user_id: submission.user_id,
          type: "review",
          title: `Track status updated: ${submission.track_title}`,
          description: `Your track status has been updated to ${action}`,
          timestamp: new Date().toISOString(),
          status: action,
          metadata: {
            submission_id: submission.id,
            bulk_action: true,
            admin_id: admin.id,
          },
        }))

        await supabase.from("activity").insert(activities)
      }
    }

    return NextResponse.json({ success: true, count: submissionIds.length })
  } catch (error) {
    console.error("Bulk action API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
