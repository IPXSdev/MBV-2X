"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, Key, Info } from "lucide-react"
import Link from "next/link"
import { signIn } from "@/lib/supabase/auth"

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("email", email)
    formData.append("password", password)

    try {
      const result = await signIn(formData)

      if (result.error) {
        setError(result.error)
      } else {
        window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error("SignIn error:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = async (testEmail: string, testPassword: string) => {
    setEmail(testEmail)
    setPassword(testPassword)

    const formData = new FormData()
    formData.append("email", testEmail)
    formData.append("password", testPassword)

    setIsLoading(true)
    setError("")

    try {
      const result = await signIn(formData)
      if (result.error) {
        setError(result.error)
      } else {
        window.location.href = "/dashboard"
      }
    } catch (err) {
      setError("Quick login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-900 border-gray-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
        <CardDescription className="text-gray-400">Sign in to your TMBM account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password / Master Key
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password or master key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
              />
            </div>
          </div>

          {error && (
            <Alert className="bg-red-900/50 border-red-700">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign up
              </Link>
            </p>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center justify-center mb-3">
                <Key className="h-4 w-4 text-purple-400 mr-2" />
                <p className="text-xs text-purple-400 font-medium">Master Dev Quick Login</p>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("2668harris@gmail.com", "demo")}
                  disabled={isLoading}
                  className="w-full text-xs bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Login as Harris (Demo)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("ipxsdev@gmail.com", "demo")}
                  disabled={isLoading}
                  className="w-full text-xs bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Login as IPXS Dev (Demo)
                </Button>
              </div>

              <div className="mt-3 p-2 bg-blue-900/20 border border-blue-700/50 rounded">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-200">
                    <p className="font-medium mb-1">Database-powered auth:</p>
                    <p>• Use "demo" as password</p>
                    <p>• Or use your secure master key</p>
                    <p>• Data persists in Supabase</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
