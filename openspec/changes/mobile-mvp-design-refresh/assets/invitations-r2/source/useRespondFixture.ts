import { useState } from 'react'
import type { Answer } from '@/shared/api'
export const useRespond = (_session: unknown, id: string) => {
  const [saved, setSaved] = useState<Answer | null>(null)
  return { saved, mutation: { isPending: false, error: null, mutate: (answer: Answer, options?: { onSuccess?: () => void }) => { setSaved(answer); window.dispatchEvent(new CustomEvent('preview-answer', { detail: { id, answer } })); options?.onSuccess?.() } } }
}
