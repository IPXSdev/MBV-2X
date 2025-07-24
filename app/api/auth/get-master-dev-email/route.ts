import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return the master dev email for auto-fill functionality
    // This is safe to expose as it's just an email address
    const masterDevEmail = "harris@tmbm.dev"

    return NextResponse.json({
      success: true,
      email: masterDevEmail,
    })
  } catch (error) {
    console.error("❌ Error getting master dev email:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get master dev email",
      },
      { status: 500 },
    )
  }
}
