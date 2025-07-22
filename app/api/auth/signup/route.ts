import { type NextRequest, NextResponse } from "next/server"
import { signUp } from "@/lib/supabase/auth"
import { validateEmail, validatePassword } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    const result = await signUp(email, password, name)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      user: result.user,
      message: "Account created successfully",
    })
  } catch (error) {
    console.error("Signup API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
