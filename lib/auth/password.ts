import bcrypt from "bcryptjs"
import { PASSWORD_CONFIG } from "./config"

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, PASSWORD_CONFIG.saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Password is required" }
  }

  if (password.length < PASSWORD_CONFIG.minLength) {
    return { valid: false, error: `Password must be at least ${PASSWORD_CONFIG.minLength} characters` }
  }

  return { valid: true }
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: "Email is required" }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address" }
  }

  return { valid: true }
}
