import { CheckIcon } from "@heroicons/react/20/solid"

const tiers = [
  {
    name: "Creator",
    id: "tier-freelancer",
    href: "#",
    priceMonthly: "$0",
    description: "Perfect for getting started and exploring the platform.",
    features: ["Access to basic features", "Limited submissions", "Community support"],
  },
  {
    name: "Indie",
    id: "tier-startup",
    href: "#",
    priceMonthly: "$19.99",
    description: "For individuals and small teams looking to scale.",
    features: ["All basic features", "Increased submission limits", "Priority support", "Team collaboration tools"],
  },
  {
    name: "Pro",
    id: "tier-enterprise",
    href: "#",
    priceMonthly: "$24.99",
    description: "Advanced features and dedicated support for professionals.",
    features: ["All Indie features", "Unlimited submissions", "Dedicated support channel", "Advanced analytics"],
  },
]

const packs = [
  {
    name: "Silver Pack",
    id: "pack-silver",
    href: "#",
    price: "$4.99",
    description: "A small boost to get you going.",
    features: ["5 Submissions"],
  },
  {
    name: "Gold Pack",
    id: "pack-gold",
    href: "#",
    price: "$9.99",
    description: "A great value for regular users.",
    features: ["15 Submissions"],
  },
  {
    name: "Platinum Pack",
    id: "pack-platinum",
    href: "#",
    price: "$17.99",
    description: "For power users who need maximum submissions.",
    features: ["35 Submissions"],
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

export default function Pricing() {
  return (
    <div className="bg-gray-900 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Pricing Plans</h2>
          <p className="mt-2 text-lg leading-8 text-gray-300">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-gray-300">Subscription Tiers</p>
        <div className="mt-16 flow-root">
          <div className="-mx-4 flex flex-wrap justify-center gap-5 sm:-mx-6 lg:-mx-8">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="mx-4 flex w-full max-w-xs flex-col justify-start rounded-xl bg-gray-800 p-8 sm:mx-6 lg:mx-8"
              >
                <div>
                  <h3 className="text-lg font-semibold leading-8 text-white">{tier.name}</h3>
                  <p className="mt-4 flex items-baseline gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-white">{tier.priceMonthly}</span>
                    <span className="text-sm font-semibold leading-6 text-gray-300">/month</span>
                  </p>
                  <p className="mt-3 text-sm leading-6 text-gray-300">{tier.description}</p>
                  <a
                    href={tier.href}
                    className="mt-8 block rounded-md bg-indigo-500 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Get started
                  </a>
                </div>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-gray-300">Submission Packs</p>
        <div className="mt-12 flow-root">
          <div className="-mx-4 flex flex-wrap justify-center gap-5 sm:-mx-6 lg:-mx-8">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="mx-4 flex w-full max-w-xs flex-col justify-start rounded-xl bg-gray-800 p-8 sm:mx-6 lg:mx-8"
              >
                <div>
                  <h3 className="text-lg font-semibold leading-8 text-white">{pack.name}</h3>
                  <p className="mt-4 flex items-baseline gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-white">{pack.price}</span>
                  </p>
                  <p className="mt-3 text-sm leading-6 text-gray-300">{pack.description}</p>
                  <a
                    href={pack.href}
                    className="mt-8 block rounded-md bg-indigo-500 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Buy Now
                  </a>
                </div>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                  {pack.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
