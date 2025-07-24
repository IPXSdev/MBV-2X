import { createClient } from "./server"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
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
  const user = await requireAuth()
  const supabase = createClient()

  try {
    const { data: profile, error } = await supabase.from("users").select("role, is_admin").eq("id", user.id).single()

    if (error || (!profile?.is_admin && profile?.role !== "admin")) {
      redirect("/dashboard")
    }

    return user
  } catch (error) {
    console.error("Error checking admin status:", error)
    redirect("/dashboard")
  }
}

export async function requireMasterDev(): Promise<User> {
  const user = await requireAuth()
  const supabase = createClient()

  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("role, is_master_dev")
      .eq("id", user.id)
      .single()

    if (error || (!profile?.is_master_dev && profile?.role !== "master_dev")) {
      redirect("/dashboard")
    }

    return user
  } catch (error) {
    console.error("Error checking master dev status:", error)
    redirect("/dashboard")
  }
}

export async function getUserRole(userId: string): Promise<string | null> {
  const supabase = createClient()

  try {
    const { data: profile, error } = await supabase.from("users").select("role").eq("id", userId).single()

    if (error) {
      console.error("Error getting user role:", error)
      return null
    }

    return profile?.role || "user"
  } catch (error) {
    console.error("Error in getUserRole:", error)
    return null
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { data: profile, error } = await supabase.from("users").select("is_admin, role").eq("id", userId).single()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    return profile?.is_admin || profile?.role === "admin"
  } catch (error) {
    console.error("Error in isAdmin:", error)
    return false
  }
}

export async function isMasterDev(userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("is_master_dev, role")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error checking master dev status:", error)
      return false
    }

    return profile?.is_master_dev || profile?.role === "master_dev"
  } catch (error) {
    console.error("Error in isMasterDev:", error)
    return false
  }
}

export async function validateSession(): Promise<User | null> {
  const supabase = createClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return session.user
  } catch (error) {
    console.error("Error validating session:", error)
    return null
  }
}
