import { cookies } from "next/headers"
import { createServiceClient } from "./server"
import { generateId } from "../utils"
import type { Database } from "./database.types"

type User = Database["public"]["Tables"]["users"]["Row"]

const MASTER_DEV_KEYS = [process.env.MASTER_DEV_KEY_HARRIS, process.env.MASTER_DEV_KEY_IPXS]

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return null
    }

    const supabase = await createServiceClient()

    // Get session from database
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("session_token", sessionToken)
      .single()

    if (sessionError || !session) {
      console.log("Session not found or error:", sessionError)
      return null
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      console.log("Session expired")
      // Clean up expired session
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
      return null
    }

    // Get user data
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", session.user_id).single()

    if (userError || !user) {
      console.log("User not found or error:", userError)
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (!["admin", "master_dev"].includes(user.role)) {
    throw new Error("Admin access required")
  }
  return user
}

export async function requireMasterDev(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== "master_dev") {
    throw new Error("Master developer access required")
  }
  return user
}

export async function signUp(email: string, password: string, name: string) {
  try {
    const supabase = await createServiceClient()

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return { error: "User with this email already exists" }
    }

    // Create user in our database - let Supabase generate the UUID
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email,
        name,
        tier: "creator",
        submission_credits: 3,
        role: "user",
        is_verified: false,
      })
      .select()
      .single()

    if (userError) {
      console.error("Error creating user:", userError)
      return { error: "Failed to create user account" }
    }

    // Create session
    const sessionToken = generateId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return { error: "Failed to create session" }
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return { user }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "Internal server error" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const supabase = await createServiceClient()

    // Check for master dev authentication first
    if (MASTER_DEV_KEYS.includes(password)) {
      console.log("Master dev authentication detected")

      // Check if user exists
      const { data: existingUser, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle()

      if (error) {
        console.error("Error checking existing user:", error)
        return { error: "Database error" }
      }

      let user: User

      if (existingUser) {
        // Update existing user to master_dev
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            role: "master_dev",
            tier: "pro",
            submission_credits: 999999,
            is_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id)
          .select()
          .single()

        if (updateError) {
          console.error("Error updating user:", updateError)
          return { error: "Failed to update user" }
        }

        user = updatedUser
      } else {
        // Create new master dev user - let Supabase generate the UUID
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            email,
            name: email.split("@")[0],
            tier: "pro",
            submission_credits: 999999,
            role: "master_dev",
            is_verified: true,
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating master dev user:", createError)
          return { error: "Failed to create master dev user" }
        }

        user = newUser
      }

      // Create session
      const sessionToken = generateId()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const { error: sessionError } = await supabase.from("user_sessions").insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      })

      if (sessionError) {
        console.error("Error creating session:", sessionError)
        return { error: "Failed to create session" }
      }

      // Set cookie
      const cookieStore = await cookies()
      cookieStore.set("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      })

      return { user }
    }

    // Regular user authentication
    const { data: existingUser, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle()

    if (error) {
      console.error("Error checking user:", error)
      return { error: "Database error" }
    }

    if (!existingUser) {
      return { error: "Invalid email or password" }
    }

    // Simple password validation (in production, use proper password hashing)
    if (password.length < 6) {
      return { error: "Invalid email or password" }
    }

    // Create session
    const sessionToken = generateId()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: existingUser.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return { error: "Failed to create session" }
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return { user: existingUser }
  } catch (error) {
    console.error("Sign in error:", error)
    return { error: "Internal server error" }
  }
}

export async function signOut() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (sessionToken) {
      const supabase = await createServiceClient()

      // Delete session from database
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
    }

    // Clear cookie
    cookieStore.delete("session_token")

    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return { error: "Failed to sign out" }
  }
}
