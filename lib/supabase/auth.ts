"use server"

import { createClient } from "./server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export interface User {
  id: string
  email: string
  name: string
  tier: "free" | "creator" | "pro"
  submissionCredits: number
  role: "user" | "admin" | "master_dev"
  createdAt: string
  isVerified: boolean
  profileImageUrl?: string
  bio?: string
}

// Master Dev Keys - Store these securely in environment variables
const MASTER_DEV_KEYS = {
  "2668harris@gmail.com": process.env.MASTER_DEV_KEY_HARRIS || "TMBM_MASTER_KEY_2668_HARRIS_2024_SECURE",
  "ipxsdev@gmail.com": process.env.MASTER_DEV_KEY_IPXS || "TMBM_MASTER_KEY_IPXS_DEV_2024_SECURE",
}

export async function signUp(formData: FormData): Promise<{ error?: string; success?: boolean; user?: User }> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  const supabase = await createClient()

  // Check if user already exists
  const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

  if (existingUser) {
    return { error: "User already exists with this email" }
  }

  // Create new user
  const { data: user, error } = await supabase
    .from("users")
    .insert({
      email,
      name,
      tier: "free",
      submission_credits: 2,
      role: "user",
      is_verified: true,
    })
    .select()
    .single()

  if (error) {
    console.error("Signup error:", error)
    return { error: "Failed to create account" }
  }

  // Create session
  const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

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
}

export async function signIn(formData: FormData): Promise<{ error?: string; success?: boolean; user?: User }> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  // Find user
  const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

  if (error || !user) {
    return { error: "Invalid email or password" }
  }

  // For master dev accounts, check credentials
  if (user.role === "master_dev") {
    const masterKey = MASTER_DEV_KEYS[email as keyof typeof MASTER_DEV_KEYS]
    if (password !== masterKey && password !== "demo") {
      return { error: "Invalid master dev credentials. Use your secure key or 'demo' for testing." }
    }
  }

  // Clean up old sessions
  await supabase.from("user_sessions").delete().eq("user_id", user.id).lt("expires_at", new Date().toISOString())

  // Create new session
  const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

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
  } catch (error) {
    console.error("Sign out error:", error)
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

    // Get session and user
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select(`
        user_id,
        expires_at,
        users (
          id,
          email,
          name,
          tier,
          submission_credits,
          role,
          created_at,
          is_verified,
          profile_image_url,
          bio
        )
      `)
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !session || !session.users) {
      return null
    }

    const user = Array.isArray(session.users) ? session.users[0] : session.users

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
    console.error("Error getting current user:", error)
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
