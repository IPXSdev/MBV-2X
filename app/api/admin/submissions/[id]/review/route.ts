import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser, requireAdmin } from "@/lib/supabase/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await requireAdmin(user.id)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 })
  }

  const submissionId = params.id
  const body = await request.json()
  const { rating, admin_notes, status } = body

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("submissions")
    .update({
      rating,
      admin_notes,
      status,
      reviewed_by: user.id,
    })
    .eq("id", submissionId)
    .select(`
        *,
        users (
            id,
            name,
            email,
            tier
        )
    `)
    .single()

  if (error) {
    console.error("Error updating submission:", error)
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
  }

  const submissionWithUser = {
    ...data,
    user: Array.isArray(data.users) ? data.users[0] : data.users,
  }

  return NextResponse.json(submissionWithUser)
}
