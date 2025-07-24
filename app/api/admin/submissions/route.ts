import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const rankedFilter = searchParams.get("rankedFilter") || "all"
    const statusFilter = searchParams.get("statusFilter") || "all"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase
      .from("submissions")
      .select(
        `
          *,
          users!inner(
            id,
            username,
            email,
            tier,
            role
          )
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })

    // Apply ranked filters
    switch (rankedFilter) {
      case "ranked":
        query = query.not("admin_rating", "is", null)
        break
      case "unranked":
        query = query.is("admin_rating", null)
        break
      case "my_ranked":
        query = query.eq("reviewed_by", user.id)
        break
    }

    // Apply status filters
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    // Get paginated results
    const { data: submissions, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
    }

    // Generate signed URLs for audio files
    if (submissions && submissions.length > 0) {
      const filePaths = submissions.map((s) => s.file_path).filter(Boolean) as string[]
      if (filePaths.length > 0) {
        const { data: signedUrls, error: urlError } = await supabase.storage
          .from("audio-submissions")
          .createSignedUrls(filePaths, 60 * 5) // 5 minute expiry

        if (urlError) {
          console.error("Error creating signed URLs:", urlError)
          // Don't fail the whole request, just log the error
        }

        if (signedUrls) {
          const urlMap = new Map(signedUrls.map((item) => [item.path, item.signedUrl]))
          submissions.forEach((sub) => {
            if (sub.file_path && urlMap.has(sub.file_path)) {
              ;(sub as any).audio_url = urlMap.get(sub.file_path)
            }
          })
        }
      }
    }

    return NextResponse.json({
      submissions: submissions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Admin submissions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !["admin", "master_dev"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, submissionIds } = body

    if (!action || !submissionIds || !Array.isArray(submissionIds)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const supabase = createClient()

    switch (action) {
      case "bulk_approve":
        const { error: approveError } = await supabase
          .from("submissions")
          .update({
            status: "approved",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .in("id", submissionIds)

        if (approveError) {
          console.error("Error bulk approving submissions:", approveError)
          return NextResponse.json({ error: "Failed to approve submissions" }, { status: 500 })
        }
        break

      case "bulk_reject":
        const { error: rejectError } = await supabase
          .from("submissions")
          .update({
            status: "rejected",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .in("id", submissionIds)

        if (rejectError) {
          console.error("Error bulk rejecting submissions:", rejectError)
          return NextResponse.json({ error: "Failed to reject submissions" }, { status: 500 })
        }
        break

      case "bulk_delete":
        // First delete the audio files from storage
        const { data: submissions } = await supabase.from("submissions").select("file_path").in("id", submissionIds)

        if (submissions) {
          const filePaths = submissions
            .map((s) => s.file_path)
            .filter(Boolean)
            .map((path) => path.replace("audio-submissions/", ""))

          if (filePaths.length > 0) {
            await supabase.storage.from("audio-submissions").remove(filePaths)
          }
        }

        // Then delete the database records
        const { error: deleteError } = await supabase.from("submissions").delete().in("id", submissionIds)

        if (deleteError) {
          console.error("Error bulk deleting submissions:", deleteError)
          return NextResponse.json({ error: "Failed to delete submissions" }, { status: 500 })
        }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action.replace("bulk_", "")}ed ${submissionIds.length} submissions`,
    })
  } catch (error) {
    console.error("Admin bulk action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
