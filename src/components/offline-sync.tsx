'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getQueue, removeFromQueue, fieldsToFormData, type QueuedWrite } from '@/lib/offline-queue'
import { saveGrades } from '@/app/dashboard/notes/actions'
import { saveAbsences } from '@/app/dashboard/absences/actions'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary().offline

// Verrou au niveau du module (pas un state de composant) : une seule
// boucle de synchronisation à la fois, y compris entre deux montages
// rapprochés du composant (double-invocation des effets en développement,
// ou un flapping online/offline qui redéclenche l'événement) — sans ça,
// deux boucles concurrentes peuvent lire la file avant que l'une n'ait
// retiré son élément et rejouer deux fois la même écriture.
let syncInFlight = false

async function replay(write: QueuedWrite): Promise<{ error?: string }> {
  const fd = fieldsToFormData(write.fields)
  fd.set('__offlineSnapshot', JSON.stringify(write.snapshot))
  if (write.kind === 'grades') return saveGrades(null, fd)
  return saveAbsences(null, fd)
}

// Rejoue la file d'attente hors-ligne (notes/absences, src/lib/offline-queue.ts)
// dès que la connexion revient. Une écriture à la fois, dans l'ordre : si le
// réseau retombe en cours de route, on s'arrête et on retentera à la
// prochaine reconnexion plutôt que de perdre l'ordre ou de sauter des
// éléments. Monté une seule fois dans dashboard/layout.tsx.
export function OfflineSync() {
  const [pendingCount, setPendingCount] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // localStorage n'existe pas côté serveur : la file ne peut être lue
    // qu'ici, après montage — le premier rendu serveur affiche donc
    // toujours "aucune file" avant correction côté client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingCount(getQueue().length)

    async function sync() {
      if (syncInFlight || getQueue().length === 0) return
      syncInFlight = true
      setSyncing(true)
      let synced = 0
      let failed = 0
      let lastError = ''

      while (true) {
        const queue = getQueue()
        if (queue.length === 0) break
        const write = queue[0]
        let result: { error?: string }
        try {
          result = await replay(write)
        } catch {
          // Toujours hors-ligne, ou réseau instable : on s'arrête ici et on
          // réessaiera au prochain événement "online" plutôt que de sauter
          // cet élément et perdre l'ordre.
          break
        }
        removeFromQueue(write.id)
        if (result?.error) {
          failed++
          lastError = result.error
        } else {
          synced++
        }
      }

      syncInFlight = false
      setSyncing(false)
      setPendingCount(getQueue().length)
      const parts: string[] = []
      if (synced > 0) parts.push(t.syncedTemplate.replace('{count}', String(synced)))
      if (failed > 0) parts.push(t.syncErrorTemplate.replace('{count}', String(failed)).replace('{error}', lastError))
      if (parts.length > 0) {
        setMessage(parts.join(' '))
        setTimeout(() => setMessage(null), 8000)
      }
    }

    window.addEventListener('online', sync)
    if (navigator.onLine) sync()
    return () => window.removeEventListener('online', sync)
  }, [])

  if (pendingCount === 0 && !message) return null

  return (
    <div className="bg-blue-50 border-b border-blue-200 text-blue-800 text-xs sm:text-sm px-4 py-2 flex items-center justify-center gap-2 text-center">
      {syncing && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
      <span>{message ?? t.pendingBadgeTemplate.replace('{count}', String(pendingCount))}</span>
    </div>
  )
}
