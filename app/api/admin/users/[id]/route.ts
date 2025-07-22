import { type NextRequest, NextResponse } from "next/server"
import { requireMasterDev } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireMasterDev()
    const supabase = await createClient()

    const { tier, role, submission_credits, is_verified } = await request.json()
    const userId = params.id

    const updateData: any = {}

    if (tier) updateData.tier = tier
    if (role) updateData.role = role
    if (typeof submission_credits === "number") updateData.submission_credits = submission_credits
    if (typeof is_verified === "boolean") updateData.is_verified = is_verified

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error("Update user API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireMasterDev()
    const supabase = await createClient()

    const userId = params.id

    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
