import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Only return the email, not the sensitive key
    const masterDevEmail = "harris@tmbm.com"

    return NextResponse.json({
      email: masterDevEmail,
    })
  } catch (error) {
    console.error("❌ Error getting master dev email:", error)
    return NextResponse.json({ error: "Failed to get master dev email" }, { status: 500 })
  }
}
