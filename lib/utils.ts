import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusBadgeColor(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    case "approved":
      return "bg-green-500/20 text-green-300 border-green-500/30"
    case "rejected":
      return "bg-red-500/20 text-red-300 border-red-500/30"
    case "under_review":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30"
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
