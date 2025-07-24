import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const { email, password, name, artist_name } = await request.json()
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        artist_name,
        role: "user",
        tier: "creator",
      },
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // The user is signed up, but we need to insert into our public `users` table
  if (authData.user) {
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata.name,
      artist_name: authData.user.user_metadata.artist_name,
      role: authData.user.user_metadata.role,
      tier: authData.user.user_metadata.tier,
    })

    if (userError) {
      // This is a problem. The auth user was created but the public user profile wasn't.
      // For now, we'll log it and return the auth error to the user.
      console.error("Failed to create public user profile:", userError)
      return NextResponse.json({ error: "Failed to create user profile. Please contact support." }, { status: 500 })
    }
  }

  return NextResponse.json({ user: authData.user }, { status: 201 })
}
