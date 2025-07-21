"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// User types
export interface User {
  id: string
  email: string
  name: string
  tier: "free" | "creator" | "pro"
  submissionCredits: number
  role: "user" | "admin" | "master_dev"
  createdAt: string
  isVerified: boolean
}

// Master Dev Keys - Store these securely
const MASTER_DEV_KEYS = {
  "2668harris@gmail.com": "TMBM_MASTER_KEY_2668_HARRIS_2024_SECURE",
  "ipxsdev@gmail.com": "TMBM_MASTER_KEY_IPXS_DEV_2024_SECURE",
}

// Mock database - replace with your actual database
const users: User[] = [
  {
    id: "master-1",
    email: "2668harris@gmail.com",
    name: "Harris (Master Dev)",
    tier: "pro",
    submissionCredits: 999,
    role: "master_dev",
    createdAt: new Date().toISOString(),
    isVerified: true,
  },
  {
    id: "master-2",
    email: "ipxsdev@gmail.com",
    name: "IPXS Dev (Master Dev)",
    tier: "pro",
    submissionCredits: 999,
    role: "master_dev",
    createdAt: new Date().toISOString(),
    isVerified: true,
  },
]

const sessions: { [key: string]: string } = {}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  console.log("SignUp attempt:", { email, name, passwordLength: password?.length })

  // Validation
  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  // Check if user already exists
  const existingUser = users.find((u) => u.email === email)
  if (existingUser) {
    return { error: "User already exists with this email" }
  }

  // Create new user with Free tier
  const newUser: User = {
    id: `user-${Date.now()}`,
    email,
    name,
    tier: "free",
    submissionCredits: 2, // Free tier gets 2 credits
    role: "user",
    createdAt: new Date().toISOString(),
    isVerified: true, // Auto-verify for demo
  }

  users.push(newUser)

  // Create session
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  sessions[sessionId] = newUser.id

  console.log("New user created:", { id: newUser.id, email: newUser.email, sessionId })

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return { success: true, user: newUser }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("SignIn attempt:", { email, passwordLength: password?.length })

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  // Find user
  const user = users.find((u) => u.email === email)
  console.log("User found:", user ? { id: user.id, email: user.email, role: user.role } : "No user found")

  if (!user) {
    return { error: "Invalid email or password" }
  }

  // For master dev accounts, check credentials
  if (user.role === "master_dev") {
    const masterKey = MASTER_DEV_KEYS[email as keyof typeof MASTER_DEV_KEYS]
    console.log("Master dev login attempt:", {
      email,
      hasKey: !!masterKey,
      keyMatch: password === masterKey,
      isDemoPassword: password === "demo",
    })

    // Allow either the master key or "demo" for testing
    if (password !== masterKey && password !== "demo") {
      console.log("Master dev auth failed - invalid credentials")
      return { error: "Invalid master dev credentials. Use your secure key or 'demo' for testing." }
    }
  } else {
    // For regular users, accept any password for demo purposes
    console.log("Regular user login - accepting any password for demo")
  }

  // Create session
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  sessions[sessionId] = user.id

  console.log("Session created:", { sessionId, userId: user.id })

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  console.log("Login successful for:", user.email)
  return { success: true, user }
}

export async function signOut() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    console.log("SignOut attempt:", { sessionId })

    if (sessionId) {
      delete sessions[sessionId]
      console.log("Session deleted:", sessionId)
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
    const sessionId = cookieStore.get("session")?.value

    console.log("GetCurrentUser:", { sessionId, hasSession: !!sessionId })

    if (!sessionId || !sessions[sessionId]) {
      console.log("No valid session found")
      return null
    }

    const userId = sessions[sessionId]
    const user = users.find((u) => u.id === userId)

    console.log("User lookup:", { userId, userFound: !!user })

    // Validate user object before returning
    if (user && user.id && user.name && user.email) {
      console.log("Valid user found:", { id: user.id, email: user.email, role: user.role })
      return user
    }

    console.log("Invalid user data")
    return null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    console.log("Auth required - redirecting to login")
    redirect("/login")
  }
  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || (user.role !== "admin" && user.role !== "master_dev")) {
    console.log("Admin required - redirecting to home")
    redirect("/")
  }
  return user
}

// Helper function to get master dev keys (for secure storage)
export function getMasterDevKeys() {
  return {
    "2668harris@gmail.com": MASTER_DEV_KEYS["2668harris@gmail.com"],
    "ipxsdev@gmail.com": MASTER_DEV_KEYS["ipxsdev@gmail.com"],
  }
}

// Debug function to check auth state
export async function debugAuth() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  return {
    sessionId,
    hasSession: !!sessionId,
    sessionExists: sessionId ? !!sessions[sessionId] : false,
    allSessions: Object.keys(sessions),
    users: users.map((u) => ({ id: u.id, email: u.email, role: u.role })),
  }
}
