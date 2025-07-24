export interface User {
  id: string
  email: string
  name: string
  role: "user" | "admin" | "master_dev"
  tier: "creator" | "indie" | "pro"
  submission_credits: number
  is_verified?: boolean
  legal_waiver_accepted?: boolean
  compensation_type?: string
  created_at?: string
  updated_at?: string
}

export interface CreateUserData {
  email: string
  name: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: User
  sessionToken?: string
  error?: string
  message?: string
}

export interface SessionData {
  userId: string
  email: string
  role: string
  tier: string
}
