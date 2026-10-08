'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

/* Vercel Web Analytics + Speed Insights solo fuera de localhost
   (sus scripts /_vercel/* existen únicamente en despliegues de Vercel). */
export function VercelInsights() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    setEnabled(!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))
  }, [])
  if (!enabled) return null
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
