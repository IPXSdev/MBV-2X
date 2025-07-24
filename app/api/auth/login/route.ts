import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

async function createSession(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ sessionToken?: string; error?: string }> {
  const sessionToken = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error: sessionError } = await supabase.from("user_sessions").insert({
    user_id: userId,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  })

  if (sessionError) {
    console.error("Login API: Failed to create session:", sessionError)
    return { error: "Database error during session creation." }
  }

  return { sessionToken }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { email, password } = await request.json()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const response = NextResponse.json({ user: data.user })

    response.cookies.set("session-token", data.session?.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    console.log(`Login API: Successful login for user ${data.user.id}.`)
    return response
  } catch (error) {
    console.error("Login API: Unhandled exception:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return NextResponse.json(
      { error: "An unexpected internal server error occurred.", details: errorMessage },
      { status: 500 },
    )
  }
}
