"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

// Initialize Stripe outside of the component to prevent re-creation on re-renders
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const tiers = [
  {
    name: "Free",
    price: "$0",
    priceId: null, // No checkout for free tier
    description: "For artists just starting out.",
    features: ["1 Submission Credit", "Basic Placement Matching", "Community Access"],
  },
  {
    name: "Pro",
    price: "$29",
    priceId: "price_1PjC9sRxH9A0g9F8fG3h4iJk", // Replace with your actual Stripe Price ID
    description: "For dedicated artists ready to level up.",
    features: ["10 Submission Credits", "Priority Placement Matching", "Direct A&R Feedback", "Analytics Dashboard"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceId: null, // Contact for enterprise
    description: "For labels, managers, and teams.",
    features: ["Unlimited Submissions", "Dedicated A&R Manager", "Team Accounts", "Custom Integrations"],
  },
]

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      router.push("/login?redirect=/pricing")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, userId: user.id, userEmail: user.email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create checkout session.")
      }

      const { sessionId } = await response.json()
      if (!sessionId) {
        throw new Error("Could not retrieve checkout session ID.")
      }

      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          console.error("Stripe redirection error:", error)
          alert(error.message)
        }
      }
    } catch (error) {
      console.error("Checkout error:", error)
      const message = error instanceof Error ? error.message : "An unknown error occurred."
      alert(`An error occurred during checkout: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">Find Your Perfect Plan</h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Unlock your potential with a plan that fits your needs. From your first submission to managing a roster of
              artists, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`flex flex-col bg-black/40 backdrop-blur-md border-white/10 shadow-2xl ${
                  tier.highlight ? "border-purple-500 scale-105" : ""
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-3xl font-semibold">{tier.name}</CardTitle>
                  <CardDescription className="text-gray-300 h-10">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <span className="text-5xl font-bold">{tier.price}</span>
                    {tier.name !== "Free" && tier.name !== "Enterprise" && (
                      <span className="text-gray-400">/month</span>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-purple-400 mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {tier.priceId ? (
                    <Button
                      onClick={() => handleCheckout(tier.priceId!)}
                      disabled={loading || authLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold h-12 rounded-lg transition-all duration-200"
                    >
                      {loading ? "Processing..." : "Get Started"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push(tier.name === "Free" ? "/signup" : "/contact")}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold h-12 rounded-lg"
                    >
                      {tier.name === "Enterprise" ? "Contact Sales" : "Sign Up for Free"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Elements>
  )
}
