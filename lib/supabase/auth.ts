"use server"

import { createClient } from "./server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export interface User {
  id: string
  email: string
  name: string
  tier: "creator" | "indie" | "pro"
  submissionCredits: number
  role: "user" | "admin" | "master_dev"
  createdAt: string
  isVerified: boolean
  profileImageUrl?: string
  bio?: string
}

// Master Dev Keys - these should match your environment variables
const MASTER_DEV_KEYS = {
  "2668harris@gmail.com": process.env.MASTER_DEV_KEY_HARRIS || "TMBM_MASTER_KEY_2668_HARRIS_2024_SECURE",
  "ipxsdev@gmail.com": process.env.MASTER_DEV_KEY_IPXS || "TMBM_MASTER_KEY_IPXS_DEV_2024_SECURE",
}

export async function signUp(formData: FormData): Promise<{ error?: string; success?: boolean; user?: User }> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  console.log("SignUp attempt for:", email)

  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  try {
    const supabase = await createClient()

    // Check if user exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).maybeSingle()

    if (existingUser) {
      return { error: "User already exists with this email" }
    }

    // Create new user with creator tier and 0 credits
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        email,
        name,
        tier: "creator",
        submission_credits: 0,
        role: "user",
        is_verified: true,
      })
      .select()
      .single()

    if (error) {
      console.error("SignUp database error:", error)
      return { error: "Failed to create account" }
    }

    // Create session
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      console.error("Session creation error:", sessionError)
      return { error: "Failed to create session" }
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    console.log("SignUp successful for:", user.email, "Tier:", user.tier)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        submissionCredits: user.submission_credits,
        role: user.role,
        createdAt: user.created_at,
        isVerified: user.is_verified,
        profileImageUrl: user.profile_image_url,
        bio: user.bio,
      },
    }
  } catch (error) {
    console.error("SignUp unexpected error:", error)
    return { error: "Service temporarily unavailable" }
  }
}

export async function signIn(formData: FormData): Promise<{ error?: string; success?: boolean; user?: User }> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("🔐 SignIn attempt for:", email)

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    const supabase = await createClient()

    // Find user - use maybeSingle() to handle multiple or no rows gracefully
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle()

    if (error) {
      console.error("❌ User lookup error:", error)
      return { error: "Database error occurred" }
    }

    if (!user) {
      console.error("❌ No user found for email:", email)
      return { error: "Invalid email or password" }
    }

    console.log("✅ Found user:", user.email, "Role:", user.role, "Tier:", user.tier)

    // Validate credentials based on role
    if (user.role === "master_dev") {
      const masterKey = MASTER_DEV_KEYS[email as keyof typeof MASTER_DEV_KEYS]
      console.log("🔑 Checking master key for:", email)
      console.log("🔑 Expected key:", masterKey)
      console.log("🔑 Provided password:", password)

      if (!masterKey || password !== masterKey) {
        console.error("❌ Master key validation failed")
        return { error: "Invalid master developer credentials" }
      }
      console.log("✅ Master dev authentication successful")
    } else {
      // For regular users, basic validation for now
      if (password.length < 6) {
        return { error: "Invalid password" }
      }
      console.log("✅ Regular user authentication (basic validation)")
    }

    // Clean up old sessions for this user
    await supabase.from("user_sessions").delete().eq("user_id", user.id).lt("expires_at", new Date().toISOString())

    // Create new session
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const { error: sessionError } = await supabase.from("user_sessions").insert({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      console.error("❌ Session creation error:", sessionError)
      return { error: "Failed to create session" }
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    console.log("✅ SignIn successful for:", user.email)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        submissionCredits: user.submission_credits,
        role: user.role,
        createdAt: user.created_at,
        isVerified: user.is_verified,
        profileImageUrl: user.profile_image_url,
        bio: user.bio,
      },
    }
  } catch (error) {
    console.error("❌ SignIn unexpected error:", error)
    return { error: "Authentication service temporarily unavailable" }
  }
}

export async function signOut(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (sessionToken) {
      const supabase = await createClient()
      await supabase.from("user_sessions").delete().eq("session_token", sessionToken)
    }

    cookieStore.delete("session")
    console.log("✅ SignOut successful")
  } catch (error) {
    console.error("❌ SignOut error:", error)
  }

  redirect("/")
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return null
    }

    const supabase = await createClient()

    // Get session and validate
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (sessionError || !session) {
      // Clean up invalid session
      cookieStore.delete("session")
      return null
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user_id)
      .maybeSingle()

    if (userError || !user) {
      cookieStore.delete("session")
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      submissionCredits: user.submission_credits,
      role: user.role,
      createdAt: user.created_at,
      isVerified: user.is_verified,
      profileImageUrl: user.profile_image_url,
      bio: user.bio,
    }
  } catch (error) {
    console.error("getCurrentUser error:", error)

    // Clean up on error
    try {
      const cookieStore = await cookies()
      cookieStore.delete("session")
    } catch (cookieError) {
      console.warn("Cookie cleanup error:", cookieError)
    }

    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "master_dev")) {
    redirect("/")
  }
  return user
}
