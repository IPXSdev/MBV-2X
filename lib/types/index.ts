export interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin" | "master_dev"
  tier: "creator" | "indie" | "pro"
  submission_credits: number
  is_verified: boolean
  legal_waiver_accepted?: boolean
  compensation_type?: string
  created_at: string
  updated_at: string
}
