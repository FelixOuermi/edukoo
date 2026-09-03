'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineBanner({ message }: { message: string }) {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    // setState synchrone dans l'effet, volontaire : le serveur rend toujours
    // "en ligne" (masqué), donc le premier rendu client doit matcher avant
    // de corriger l'état réel — un lazy-initializer lirait navigator.onLine
    // dès l'hydratation et désynchroniserait du HTML serveur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffline(!navigator.onLine)

    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="bg-amber-500 text-white text-xs sm:text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 text-center">
      <WifiOff className="w-4 h-4 shrink-0" />
      {message}
    </div>
  )
}
