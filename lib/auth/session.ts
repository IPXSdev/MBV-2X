import { cookies } from "next/headers"
import { SESSION_CONFIG } from "./config"
import { getUserBySessionToken, deleteUserSession } from "./database"
import type { User } from "./types"

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_CONFIG.cookieName)?.value

    if (!sessionToken) {
      return null
    }

    return await getUserBySessionToken(sessionToken)
  } catch (error) {
    console.error("❌ Error getting current user:", error)
    return null
  }
}

export async function setSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies()
  const expiresAt = new Date(Date.now() + SESSION_CONFIG.expiryDays * 24 * 60 * 60 * 1000)

  cookieStore.set(SESSION_CONFIG.cookieName, sessionToken, {
    httpOnly: SESSION_CONFIG.httpOnly,
    secure: SESSION_CONFIG.secure,
    sameSite: SESSION_CONFIG.sameSite,
    expires: expiresAt,
    path: "/",
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_CONFIG.cookieName)?.value

  if (sessionToken) {
    await deleteUserSession(sessionToken)
  }

  cookieStore.delete(SESSION_CONFIG.cookieName)
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
