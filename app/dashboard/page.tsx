import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="mb-4">Welcome, you are logged in!</p>
      <p className="text-sm text-gray-400 mb-1">User ID: {user.id}</p>
      <p className="text-sm text-gray-400 mb-6">Email: {user.email}</p>

      <form action="/api/auth/logout" method="post">
        <Button type="submit">Logout</Button>
      </form>
    </div>
  )
}
