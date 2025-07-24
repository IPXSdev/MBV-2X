import {
  createUser,
  getUserByEmail,
  getUserPasswordHash,
  createUserSession,
  updateUserRole,
  updateUserTier,
} from "./database"
import { hashPassword, verifyPassword, validateEmail, validatePassword } from "./password"
import { MASTER_DEV_CREDENTIALS } from "./config"
import type { CreateUserData, LoginData, AuthResult, User } from "./types"
import { randomBytes } from "crypto"

async function authenticateMasterDev(email: string, password: string): Promise<AuthResult | null> {
  const masterDev = Object.values(MASTER_DEV_CREDENTIALS).find((cred) => cred.email === email)
  if (!masterDev) {
    return null // Not a master dev email, continue with regular auth
  }

  if (password !== masterDev.key) {
    return { success: false, error: "Invalid master key" }
  }

  try {
    let user: User | null = await getUserByEmail(email)

    if (!user) {
      // Create master dev user on first login
      const passwordHash = await hashPassword(password)
      user = await createUser({
        email,
        name: email.startsWith("harris") || email.startsWith("2668") ? "Harris" : "IPXS",
        password,
        passwordHash,
        role: "master_dev",
        tier: "pro",
        submission_credits: 999999,
      })

      if (!user) {
        throw new Error("Failed to create master dev user account.")
      }
    } else {
      // Ensure existing user has correct permissions
      if (user.role !== "master_dev") {
        await updateUserRole(user.id, "master_dev")
        user.role = "master_dev"
      }
      if (user.tier !== "pro" || user.submission_credits < 999999) {
        await updateUserTier(user.id, "pro", 999999)
        user.tier = "pro"
        user.submission_credits = 999999
      }
    }

    const sessionToken = generateSessionToken()
    await createUserSession(user.id, sessionToken)

    return {
      success: true,
      user,
      sessionToken,
      message: "Master dev authentication successful",
    }
  } catch (error) {
    console.error("❌ Master dev authentication error:", error)
    return { success: false, error: "Master dev authentication failed due to a server error." }
  }
}

export async function authenticateUser(credentials: LoginData): Promise<AuthResult> {
  try {
    const { email, password } = credentials

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) return { success: false, error: emailValidation.error }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) return { success: false, error: passwordValidation.error }

    const normalizedEmail = email.toLowerCase().trim()

    // Attempt master dev login first. If it returns a result (success or fail), use it.
    // If it returns null, it's not a master dev, so proceed to regular auth.
    const masterDevResult = await authenticateMasterDev(normalizedEmail, password)
    if (masterDevResult !== null) {
      return masterDevResult
    }

    // Regular user authentication
    const user = await getUserByEmail(normalizedEmail)
    if (!user) return { success: false, error: "Invalid email or password" }

    const passwordHash = await getUserPasswordHash(normalizedEmail)
    if (!passwordHash) return { success: false, error: "Invalid email or password" }

    const isValidPassword = await verifyPassword(password, passwordHash)
    if (!isValidPassword) return { success: false, error: "Invalid email or password" }

    const sessionToken = generateSessionToken()
    await createUserSession(user.id, sessionToken)

    return {
      success: true,
      user,
      sessionToken,
      message: "Login successful",
    }
  } catch (error) {
    console.error("❌ Authentication error:", error)
    return { success: false, error: "Authentication failed due to a server error." }
  }
}

export async function registerUser(userData: CreateUserData): Promise<AuthResult> {
  try {
    const { email, password, name } = userData

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) return { success: false, error: emailValidation.error }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) return { success: false, error: passwordValidation.error }

    if (!name || name.trim().length < 2) {
      return { success: false, error: "Name must be at least 2 characters" }
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await getUserByEmail(normalizedEmail)
    if (existingUser) {
      return { success: false, error: "An account with this email already exists" }
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({
      email: normalizedEmail,
      name: name.trim(),
      password,
      passwordHash,
      // Defaults to 'user' role and 'creator' tier in createUser function
    })

    if (!user) {
      throw new Error("Failed to create user account during registration.")
    }

    const sessionToken = generateSessionToken()
    await createUserSession(user.id, sessionToken)

    return {
      success: true,
      user,
      sessionToken,
      message: "Account created successfully",
    }
  } catch (error) {
    console.error("❌ Registration error:", error)
    return { success: false, error: "Registration failed due to a server error." }
  }
}

function generateSessionToken(): string {
  return randomBytes(32).toString("hex")
}
