import { cookies } from "next/headers"
import { supabase } from "./server"

export async function requireAdmin(userId: string) {
  const { data: user, error } = await supabase.from("users").select("role").eq("id", userId).single()

  if (error || !user) {
    throw new Error("User not found")
  }

  if (user.role !== "admin" && user.role !== "master_dev") {
    throw new Error("Admin access required")
  }

  return user
}

export async function requireMasterDev(userId: string) {
  const { data: user, error } = await supabase.from("users").select("role").eq("id", userId).single()

  if (error || !user) {
    throw new Error("User not found")
  }

  if (user.role !== "master_dev") {
    throw new Error("Master dev access required")
  }

  return user
}

export async function getUserRole(userId: string) {
  const { data: user, error } = await supabase.from("users").select("role").eq("id", userId).single()

  if (error || !user) {
    return null
  }

  return user.role
}

export async function getCurrentUser() {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get("session-token")?.value

  if (!sessionToken) {
    return null
  }

  const { data: session, error: sessionError } = await supabase
    .from("user_sessions")
    .select("user_id")
    .eq("session_token", sessionToken)
    .single()

  if (sessionError || !session) {
    return null
  }

  const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", session.user_id).single()

  if (userError || !user) {
    return null
  }

  return user
}
