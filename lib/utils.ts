import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return uuidv4()
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return formatDate(date)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function getTierInfo(tier: string) {
  switch (tier) {
    case "creator":
      return {
        name: "Creator",
        color: "bg-blue-500",
        gradientFrom: "from-blue-500",
        gradientTo: "to-blue-600",
        textColor: "text-blue-400",
        features: ["View select podcast clips", "Behind-the-scenes sneak peeks", "Music placement announcements"],
        upgradeText: "Upgrade to Indie ($19.99/mo) or Pro ($24.99/mo) to submit music for review!",
        monthlyCredits: 0,
      }
    case "indie":
      return {
        name: "Indie",
        color: "bg-purple-500",
        gradientFrom: "from-purple-500",
        gradientTo: "to-purple-600",
        textColor: "text-purple-400",
        features: [
          "Submit 1 track per month",
          "Professional feedback",
          "Priority review queue",
          "All Creator features",
        ],
        upgradeText: "Upgrade to Pro for unlimited submissions and premium features!",
        monthlyCredits: 1,
      }
    case "pro":
      return {
        name: "Pro",
        color: "bg-gradient-to-r from-purple-500 to-pink-500",
        gradientFrom: "from-purple-500",
        gradientTo: "to-pink-500",
        textColor: "text-purple-400",
        features: [
          "Submit 2 tracks per month",
          "Direct artist connections",
          "Exclusive industry events",
          "All Indie features",
        ],
        upgradeText: null,
        monthlyCredits: 2,
      }
    default:
      return {
        name: "Creator",
        color: "bg-blue-500",
        gradientFrom: "from-blue-500",
        gradientTo: "to-blue-600",
        textColor: "text-blue-400",
        features: [],
        upgradeText: null,
        monthlyCredits: 0,
      }
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "text-green-400"
    case "rejected":
      return "text-red-400"
    case "in_review":
      return "text-yellow-400"
    case "pending":
      return "text-blue-400"
    default:
      return "text-gray-400"
  }
}

export function getStatusBadgeColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-500"
    case "rejected":
      return "bg-red-500"
    case "in_review":
      return "bg-yellow-500"
    case "pending":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
