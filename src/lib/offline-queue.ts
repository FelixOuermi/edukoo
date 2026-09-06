'use client'

// File d'attente hors-ligne pour la saisie de notes et d'absences
// uniquement (pas les paiements — un doublon d'encaissement est un risque
// trop élevé pour une synchronisation automatique). Stockée en
// localStorage : per-appareil, per-navigateur, perdue si l'utilisateur
// vide ses données de site avant reconnexion — acceptable pour ce cas
// d'usage (quelques saisies en attendant le réseau, pas un stockage
// durable).
export type QueuedWriteKind = 'grades' | 'absences'

export interface QueuedWrite {
  id: string
  kind: QueuedWriteKind
  queuedAt: string
  // FormData sérialisé : une clé peut apparaître plusieurs fois
  // (studentId, gradeTypeId...), d'où un tableau de valeurs par clé.
  fields: Record<string, string[]>
  // Valeurs vues à l'écran au moment de la saisie hors-ligne (avant
  // modification), pour que le serveur puisse détecter si quelqu'un
  // d'autre a changé la même donnée entre-temps.
  snapshot: Record<string, string>
}

const STORAGE_KEY = 'edukoo_offline_queue'

function readQueue(): QueuedWrite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QueuedWrite[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: QueuedWrite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Stockage plein ou indisponible (navigation privée) : la mise en
    // attente est un confort, pas une garantie — on abandonne
    // silencieusement plutôt que de bloquer la saisie de l'utilisateur.
  }
}

export function formDataToFields(formData: FormData): Record<string, string[]> {
  const fields: Record<string, string[]> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') continue // pas de fichiers dans ce flux (notes/absences)
    ;(fields[key] ??= []).push(value)
  }
  return fields
}

export function fieldsToFormData(fields: Record<string, string[]>): FormData {
  const fd = new FormData()
  for (const [key, values] of Object.entries(fields)) {
    for (const value of values) fd.append(key, value)
  }
  return fd
}

export function enqueueWrite(write: Omit<QueuedWrite, 'id' | 'queuedAt'>): void {
  const queue = readQueue()
  queue.push({ ...write, id: crypto.randomUUID(), queuedAt: new Date().toISOString() })
  writeQueue(queue)
}

export function getQueue(): QueuedWrite[] {
  return readQueue()
}

export function removeFromQueue(id: string): void {
  writeQueue(readQueue().filter((w) => w.id !== id))
}

export function queueCount(): number {
  return readQueue().length
}
