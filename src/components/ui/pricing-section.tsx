"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: {
    monthly: number | string
    yearly: number | string
  }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
}

function PricingSection({ tiers, className }: PricingSectionProps) {
  const buttonStyles = {
    default: cn(
      "h-10 bg-white dark:bg-zinc-900",
      "hover:bg-slate-50 dark:hover:bg-zinc-800",
      "text-slate-900 dark:text-zinc-100",
      "border border-slate-400 dark:border-zinc-800",
      "hover:border-slate-500 dark:hover:border-zinc-700",
      "shadow-sm hover:shadow-md",
      "text-sm font-bold",
    ),
    highlight: cn(
      "h-10 bg-slate-900 dark:bg-zinc-100",
      "hover:bg-slate-800 dark:hover:bg-zinc-300",
      "text-white dark:text-zinc-900",
      "shadow-[0_1px_15px_rgba(0,0,0,0.1)]",
      "hover:shadow-[0_1px_20px_rgba(0,0,0,0.15)]",
      "font-bold text-sm",
    ),
  }

  const badgeStyles = cn(
    "px-3 py-1 text-xs font-bold",
    "bg-zinc-900 dark:bg-zinc-100",
    "text-white dark:text-zinc-900",
    "border-none shadow-lg",
  )

  return (
    <section
      className={cn(
        "relative bg-background text-foreground",
        "py-12 px-4 md:py-24 lg:py-32",
        "overflow-hidden",
        className,
      )}
    >
      <div className="w-full max-w-6xl mx-auto">

        <div className="flex justify-center">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative group backdrop-blur-sm",
                "rounded-2xl transition-all duration-300",
                "flex flex-col w-full max-w-2xl",
                tier.highlight
                  ? "bg-gradient-to-b from-blue-50/90 to-white dark:from-zinc-400/[0.15]"
                  : "bg-white dark:bg-zinc-800/50",
                "border",
                tier.highlight
                  ? "border-blue-300 dark:border-zinc-400/20 shadow-xl"
                  : "border-slate-300 dark:border-zinc-700 shadow-md",
                "hover:translate-y-0 hover:shadow-lg",
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-3 left-4">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      tier.highlight
                        ? "bg-blue-100 dark:bg-zinc-800 text-blue-700 dark:text-zinc-100"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400",
                    )}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-black text-black dark:text-zinc-100">
                    {tier.name}
                  </h3>
                </div>

                <div className="mb-5">
                  {(() => {
                    const currentPrice = tier.price.monthly
                    const isCustom = typeof currentPrice === "string"

                    return (
                      <div
                        className={cn(
                          "w-full",
                          isCustom
                            ? "flex items-center justify-center text-center"
                            : "flex items-baseline gap-1",
                        )}
                      >
                        <span
                          className={cn(
                            "font-black",
                            isCustom
                              ? "text-5xl sm:text-6xl text-black"
                              : "text-3xl text-black dark:text-zinc-100",
                          )}
                        >
                          {isCustom ? "Custom" : `${currentPrice} RWF`}
                        </span>
                      </div>
                    )
                  })()}
                  <p className="mt-3 text-base text-black dark:text-zinc-300 font-semibold" style={{ color: '#000000' }}>
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-3">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex gap-3">
                      <div
                        className={cn(
                          "mt-0.5 p-0.5 rounded-full transition-colors duration-200",
                          feature.included
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400 dark:text-zinc-600",
                        )}
                      >
                        <CheckIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-base font-bold dark:text-zinc-100" style={{ color: '#000000' }}>
                          {feature.name}
                        </div>
                        <div className="text-sm font-medium dark:text-zinc-400" style={{ color: '#000000' }}>
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto">
                <Link
                  to="/get-started"
                  className={cn(
                    "w-full relative transition-all duration-300 h-10 inline-flex items-center justify-center rounded-md",
                    tier.highlight
                      ? buttonStyles.highlight
                      : buttonStyles.default,
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
                    {tier.highlight ? (
                      <>
                        Get started
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Get started
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { PricingSection }
