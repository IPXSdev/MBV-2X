import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// This is the singleton instance for server-side use.
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// This is a factory function to create a new client instance if needed.
export const createServiceClient = () => {
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Re-exporting the original createClient function for compatibility.
export const createClient = createSupabaseClient

export default supabase
