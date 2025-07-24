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
