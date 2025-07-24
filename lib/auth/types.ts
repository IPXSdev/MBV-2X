export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  sessionToken?: string
  error?: string
  message?: string
}
