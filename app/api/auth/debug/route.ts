import { debugAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const debugInfo = await debugAuth()
    return NextResponse.json(debugInfo)
  } catch (error) {
    return NextResponse.json({ error: "Debug failed", details: error }, { status: 500 })
  }
}
