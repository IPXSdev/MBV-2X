import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { action, submissionIds } = await request.json()

    if (!action || !submissionIds || !Array.isArray(submissionIds)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    let updateData: any = {}
    let shouldDelete = false

    switch (action) {
      case "approve":
        updateData = { status: "approved", updated_at: new Date().toISOString() }
        break
      case "reject":
        updateData = { status: "rejected", updated_at: new Date().toISOString() }
        break
      case "pending":
        updateData = { status: "pending", updated_at: new Date().toISOString() }
        break
      case "in_review":
        updateData = { status: "in_review", updated_at: new Date().toISOString() }
        break
      case "delete":
        shouldDelete = true
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (shouldDelete) {
      // Delete related reviews first
      await supabase.from("reviews").delete().in("submission_id", submissionIds)

      // Then delete submissions
      const { error } = await supabase.from("submissions").delete().in("id", submissionIds)

      if (error) {
        console.error("Error deleting submissions:", error)
        return NextResponse.json({ error: "Failed to delete submissions" }, { status: 500 })
      }
    } else {
      // Update submissions
      const { error } = await supabase.from("submissions").update(updateData).in("id", submissionIds)

      if (error) {
        console.error("Error updating submissions:", error)
        return NextResponse.json({ error: "Failed to update submissions" }, { status: 500 })
      }

      // Create bulk review records for status changes
      if (action !== "pending") {
        const reviewRecords = submissionIds.map((id) => ({
          submission_id: id,
          reviewer_id: admin.id,
          feedback: `Bulk ${action} by admin`,
          created_at: new Date().toISOString(),
        }))

        await supabase.from("reviews").insert(reviewRecords)
      }
    }

    return NextResponse.json({ success: true, affected: submissionIds.length })
  } catch (error) {
    console.error("Bulk action API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
