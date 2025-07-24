"use client"

// components/dashboard/master-dev-panel.tsx

import { useAuth } from "@/contexts/auth"

export function MasterDevPanel() {
  const { user } = useAuth()

  // This check is now more secure and role-based
  if (user?.role !== "master_dev") {
    return null
  }

  return (
    <div>
      <h1>Master Developer Panel</h1>
      <p>Welcome, Master Developer!</p>
      {/* Add master developer tools and information here */}
    </div>
  )
}
