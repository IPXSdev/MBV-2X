"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, User, LogOut, Settings, AlertCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "./auth/auth-provider"

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isLoading, error } = useAuth()

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/podcast", label: "Podcast" },
    { href: "/placements", label: "Placements" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ]

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-110">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/holographic%20nav%20logo-qI8h2EHhrvruK8MhJfUE8k87DbX2xv.png"
                alt="The Man Behind the Music"
                className="w-full h-full object-cover scale-110"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-black/10" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:block bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              TMBM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}

            {/* Auth Section */}
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-800 animate-pulse rounded" />
            ) : error ? (
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Connection Error</span>
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:text-purple-300 flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="max-w-24 truncate">{user.name || "User"}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 min-w-48">
                  <div className="px-3 py-2 border-b border-gray-700">
                    <p className="text-sm text-white font-medium">{user.name || "User"}</p>
                    <p className="text-xs text-gray-400">{user.email || ""}</p>
                    {user.tier && (
                      <div className="flex items-center mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            user.tier === "free"
                              ? "bg-gray-700 text-gray-300"
                              : user.tier === "creator"
                                ? "bg-blue-700 text-blue-200"
                                : "bg-purple-700 text-purple-200"
                          }`}
                        >
                          {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Tier
                        </span>
                      </div>
                    )}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="text-white hover:text-purple-300 flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === "admin" || user.role === "master_dev") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="text-purple-300 hover:text-purple-200 flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Admin Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={handleLogout} className="text-white hover:text-red-300 flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" className="text-white hover:text-purple-300">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-white transition-colors duration-200 font-medium px-2 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {error && (
                <div className="flex items-center space-x-2 text-red-400 px-2 py-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Connection Error</span>
                </div>
              )}

              {user ? (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-800">
                  <div className="px-2 py-1">
                    <p className="text-white font-medium">{user.name || "User"}</p>
                    <p className="text-xs text-gray-400">{user.email || ""}</p>
                    {user.tier && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                          user.tier === "free"
                            ? "bg-gray-700 text-gray-300"
                            : user.tier === "creator"
                              ? "bg-blue-700 text-blue-200"
                              : "bg-purple-700 text-purple-200"
                        }`}
                      >
                        {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Tier
                      </span>
                    )}
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-white hover:text-purple-300 px-2 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {(user.role === "admin" || user.role === "master_dev") && (
                    <Link
                      href="/admin"
                      className="text-purple-300 hover:text-purple-200 px-2 py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Portal
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-red-300 hover:text-red-400 px-2 py-1 text-left"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-800">
                  <Link
                    href="/login"
                    className="text-white hover:text-purple-300 px-2 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="text-white hover:text-purple-300 px-2 py-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
