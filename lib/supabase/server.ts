import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createClientWithAuth() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle cookie setting errors in server components
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // Handle cookie removal errors in server components
        }
      },
    },
  })
}

export async function getUser() {
  const supabase = createClientWithAuth()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting user:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Error in getUser:", error)
    return null
  }
}

export async function getSession() {
  const supabase = createClientWithAuth()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    return session
  } catch (error) {
    console.error("Error in getSession:", error)
    return null
  }
}

export async function signOut() {
  const supabase = createClientWithAuth()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in signOut:", error)
    throw error
  }
}

export async function refreshSession() {
  const supabase = createClientWithAuth()

  try {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error("Error refreshing session:", error)
      return null
    }

    return data.session
  } catch (error) {
    console.error("Error in refreshSession:", error)
    return null
  }
}
