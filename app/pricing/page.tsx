"use client"

import type React from "react"
import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { CheckIcon, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPlan?: string
}

function AuthModal({ isOpen, onClose, selectedPlan }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        console.error("Authentication failed")
      }
    } catch (error) {
      console.error("Authentication error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">{isLogin ? "Sign In" : "Create Account"}</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            {selectedPlan && `Continue with ${selectedPlan} plan`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-400 hover:text-blue-300">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Initialize Stripe outside of the component render to avoid re-creating the Stripe object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const tiers = [
  {
    name: "Creator",
    price: "$0",
    description: "Get started and explore the platform.",
    features: ["View podcast clips", "See BTS previews", "Read placement announcements"],
    priceId: null,
    tierKey: "free",
  },
  {
    name: "Indie",
    price: "$19.99",
    priceSuffix: "/ month",
    description: "For artists ready to get heard.",
    features: [
      "1 song submission/mo",
      "Extended BTS access",
      "Music presented to A&Rs",
      "Reviewed in podcast breakdowns",
    ],
    priceId: "price_1PfA6qRxH3a7y9z8abcd1234", // Replace with your actual Stripe Price ID
    tierKey: "indie",
  },
  {
    name: "Pro",
    price: "$24.99",
    priceSuffix: "/ month",
    description: "For serious creators seeking maximum exposure.",
    features: [
      "2 song submissions/mo",
      "Full BTS & podcast access",
      "Weekly DJ sets inclusion",
      "Featured in live mixes",
    ],
    priceId: "price_1PfA6qRxH3a7y9z8efgh5678", // Replace with your actual Stripe Price ID
    tierKey: "pro",
  },
]

function PricingContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      router.push("/login?redirect=/pricing")
      return
    }
    setIsLoading(priceId)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, userId: user.id, email: user.email }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { sessionId } = await response.json()
      const stripe = await stripePromise
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error("Stripe checkout error:", error)
      // Add user-facing error message here
    } finally {
      setIsLoading(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen p-4 sm:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Find Your Perfect Plan</h1>
        <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
          Join a community of creators and get your music in front of industry legends.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`bg-black/40 backdrop-blur-md border flex flex-col ${
              user?.tier === tier.tierKey ? "border-purple-500 shadow-purple-500/20 shadow-lg" : "border-white/10"
            }`}
          >
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">{tier.name}</CardTitle>
              <div className="text-4xl font-extrabold mt-4">
                {tier.price}
                <span className="text-lg font-normal text-gray-400">{tier.priceSuffix}</span>
              </div>
              <CardDescription className="text-gray-300 h-10 mt-2">{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow py-6">
              <ul className="space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {user?.tier === tier.tierKey ? (
                <Button
                  disabled
                  className="w-full bg-purple-600 text-white font-semibold h-12 rounded-lg transition-all duration-200"
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={() => tier.priceId && handleCheckout(tier.priceId)}
                  disabled={!tier.priceId || !!isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold h-12 rounded-lg transition-all duration-200"
                >
                  {isLoading === tier.priceId ? <Loader2 className="w-5 h-5 animate-spin" /> : `Choose ${tier.name}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function PricingPageWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <PricingContent />
    </Elements>
  )
}
