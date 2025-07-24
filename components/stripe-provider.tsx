"use client"

import type { ReactNode } from "react"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"

let stripePromise: Promise<Stripe | null>

const getStripePromise = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    console.error("Stripe public key is not set.")
    return null
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

export function StripeElementsProvider({ children }: { children: ReactNode }) {
  const stripe = getStripePromise()
  if (!stripe) {
    return <>{children}</>
  }

  return <Elements stripe={stripe}>{children}</Elements>
}
