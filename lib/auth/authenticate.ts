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
import type { CreateUserData, LoginData, AuthResult } from "./types"
import { randomBytes } from "crypto"

export async function authenticateUser(credentials: LoginData): Promise<AuthResult> {
  try {
    const { email, password } = credentials

    // Validate input
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error }
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check for master dev authentication
    const masterDevResult = await authenticateMasterDev(normalizedEmail, password)
    if (masterDevResult) {
      return masterDevResult
    }

    // Regular user authentication
    const user = await getUserByEmail(normalizedEmail)
    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    const passwordHash = await getUserPasswordHash(normalizedEmail)
    if (!passwordHash) {
      return { success: false, error: "Invalid email or password" }
    }

    const isValidPassword = await verifyPassword(password, passwordHash)
    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" }
    }

    // Create session
    const sessionToken = generateSessionToken()
    await createUserSession(user.id, sessionToken)

    return {
      success: true,
      user,
      message: "Login successful",
    }
  } catch (error) {
    console.error("❌ Authentication error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function registerUser(userData: CreateUserData): Promise<AuthResult> {
  try {
    const { email, password, name } = userData

    // Validate input
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error }
    }

    if (!name || name.trim().length < 2) {
      return { success: false, error: "Name must be at least 2 characters" }
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await getUserByEmail(normalizedEmail)
    if (existingUser) {
      return { success: false, error: "An account with this email already exists" }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const user = await createUser({
      email: normalizedEmail,
      name: name.trim(),
      password,
      passwordHash,
    })

    // Create session
    const sessionToken = generateSessionToken()
    await createUserSession(user.id, sessionToken)

    return {
      success: true,
      user,
      message: "Account created successfully",
    }
  } catch (error) {
    console.error("❌ Registration error:", error)
    return { success: false, error: "Registration failed" }
  }
}

async function authenticateMasterDev(email: string, password: string): Promise<AuthResult | null> {
  try {
    // Check if this is a master dev email
    const masterDev = Object.values(MASTER_DEV_CREDENTIALS).find((cred) => cred.email === email)
    if (!masterDev || !masterDev.key) {
      return null
    }

    // Verify master dev key
    if (password !== masterDev.key) {
      return null
    }

    // Get or create master dev user
    let user = await getUserByEmail(email)

    if (!user) {
      // Create new master dev user
      const passwordHash = await hashPassword(password)
      user = await createUser({
        email,
        name: email === "harris@tmbm.com" ? "Harris" : "IPXS",
        password,
        passwordHash,
      })
    }

    // Ensure user has master_dev role and pro tier
    if (user.role !== "master_dev") {
      await updateUserRole(user.id, "master_dev")
      user.role = "master_dev"
    }

    if (user.tier !== "pro" || user.submission_credits < 999999) {
      await updateUserTier(user.id, "pro", 999999)
      user.tier = "pro"
      user.submission_credits = 999999
    }

    // Create session
    const sessionToken = generateSessionToken()
    await createUserSession(user.id, sessionToken)

    return {
      success: true,
      user,
      message: "Master dev authentication successful",
    }
  } catch (error) {
    console.error("❌ Master dev authentication error:", error)
    return null
  }
}

function generateSessionToken(): string {
  return randomBytes(32).toString("hex")
}
