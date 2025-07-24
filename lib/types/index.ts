export interface User {
  id: string
  email: string
  name: string | null
  role: "user" | "admin" | "master_dev"
  tier: "creator" | "indie" | "pro"
  submission_credits: number
  is_verified: boolean
  legal_waiver_accepted: boolean | null
  compensation_type: string | null
  created_at: string
  updated_at: string
  password_hash?: string | null
}
