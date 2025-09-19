'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface SocialLoginButtonsProps {
  className?: string
  callbackUrl?: string
}

export function SocialLoginButtons({ className = "", callbackUrl = "/" }: SocialLoginButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  // Placeholder for future social login implementation with Medusa
  const handleSocialLogin = async (providerId: string) => {
    setLoading(providerId)
    // TODO: Implement Medusa-based social authentication
    alert('Social login będzie dostępny wkrótce')
    setLoading(null)
  }

  // Static providers for UI (will be replaced with actual Medusa social auth)
  const staticProviders = {
    google: { name: 'Google' },
    facebook: { name: 'Facebook' }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            lub kontynuuj z
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(staticProviders).map(([id, provider]) => (
          <motion.div
            key={id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin(id)}
              disabled={loading === id}
            >
              {loading === id ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              ) : (
                <div className="mr-2 h-4 w-4" />
              )}
              {provider.name}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}