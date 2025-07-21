import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Ignore cookie errors in server components
        }
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return null
    }

    const supabase = await createClient()

    // Get session and user in one query with join
    const { data: sessionData, error: sessionError } = await supabase
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
          is_verified,
          profile_image_url,
          bio,
          created_at,
          updated_at
        )
      `)
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !sessionData || !sessionData.users) {
      // Clean up invalid session
      cookieStore.delete("session")
      return null
    }

    const user = Array.isArray(sessionData.users) ? sessionData.users[0] : sessionData.users

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      submissionCredits: user.submission_credits,
      role: user.role,
      isVerified: user.is_verified,
      profileImageUrl: user.profile_image_url,
      bio: user.bio,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }
  } catch (error) {
    console.error("getCurrentUser error:", error)
    return null
  }
}
