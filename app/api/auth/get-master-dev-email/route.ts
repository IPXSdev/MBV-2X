import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return the master dev email (this is not sensitive information)
    return NextResponse.json({
      success: true,
      email: "harris@tmbm.dev",
    })
  } catch (error) {
    console.error("Error getting master dev email:", error)
    return NextResponse.json({ success: false, error: "Failed to get master dev email" }, { status: 500 })
  }
}
