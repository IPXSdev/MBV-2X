import { createClient } from "@supabase/supabase-js"
import type { User, CreateUserData } from "./types"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function createUser(
  userData: CreateUserData & {
    passwordHash: string
    role?: "user" | "admin" | "master_dev"
    tier?: "creator" | "indie" | "pro"
    submission_credits?: number
  },
): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert({
        email: userData.email.toLowerCase().trim(),
        name: userData.name.trim(),
        password_hash: userData.passwordHash,
        role: userData.role || "user",
        tier: userData.tier || "creator",
        submission_credits: userData.submission_credits ?? 3,
        is_verified: true,
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Database error creating user:", error)
      return null
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      tier: data.tier,
      submission_credits: data.submission_credits,
      is_verified: data.is_verified,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error("❌ Exception during user creation:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email.toLowerCase().trim()).single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // User not found, which is not an error in this context.
      }
      console.error("❌ Database error getting user by email:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("❌ Exception getting user by email:", error)
    return null
  }
}

export async function getUserPasswordHash(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("password_hash")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (error || !data) {
      return null
    }

    return data.password_hash
  } catch (error) {
    console.error("❌ Exception getting password hash:", error)
    return null
  }
}

export async function createUserSession(userId: string, sessionToken: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error } = await supabase.from("user_sessions").insert({
    user_id: userId,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    console.error("❌ Error creating session:", error)
    throw new Error("Failed to create session")
  }
}

export async function getUserBySessionToken(sessionToken: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("user_sessions")
      .select(
        `
        user_id,
        expires_at,
        users (
          id,
          email,
          name,
          role,
          tier,
          submission_credits,
          is_verified,
          legal_waiver_accepted,
          compensation_type,
          created_at,
          updated_at
        )
      `,
      )
      .eq("session_token", sessionToken)
      .single()

    if (error || !data || !data.users) {
      return null
    }

    if (new Date(data.expires_at) < new Date()) {
      await deleteUserSession(sessionToken)
      return null
    }

    return Array.isArray(data.users) ? data.users[0] : data.users
  } catch (error) {
    console.error("❌ Exception getting user by session token:", error)
    return null
  }
}

export async function deleteUserSession(sessionToken: string): Promise<void> {
  const { error } = await supabase.from("user_sessions").delete().eq("session_token", sessionToken)

  if (error) {
    console.error("❌ Error deleting session:", error)
  }
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const { error } = await supabase.from("user_sessions").delete().eq("user_id", userId)

  if (error) {
    console.error("❌ Error deleting user sessions:", error)
  }
}

export async function updateUserRole(userId: string, role: "user" | "admin" | "master_dev"): Promise<void> {
  const { error } = await supabase.from("users").update({ role }).eq("id", userId)

  if (error) {
    console.error("❌ Error updating user role:", error)
    throw new Error("Failed to update user role")
  }
}

export async function updateUserTier(
  userId: string,
  tier: "creator" | "indie" | "pro",
  credits: number,
): Promise<void> {
  const { error } = await supabase.from("users").update({ tier, submission_credits: credits }).eq("id", userId)

  if (error) {
    console.error("❌ Error updating user tier:", error)
    throw new Error("Failed to update user tier")
  }
}
