import { useEffect, useState } from 'react'
import { invitations } from '@preview/data'
export const useInvitationsPreview = () => {
  const [state, setState] = useState(new URLSearchParams(location.search).get('state') ?? 'ready')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source === parent && event.data?.type === 'invitations-preview-state') { setState(event.data.value); setAnswers({}) }
    }
    const respond = (event: Event) => { const { id, answer } = (event as CustomEvent<{ id: string; answer: string }>).detail; setAnswers(previous => ({ ...previous, [id]: answer })) }
    window.addEventListener('message', receive)
    window.addEventListener('preview-answer', respond)
    return () => { window.removeEventListener('message', receive); window.removeEventListener('preview-answer', respond) }
  }, [])
  const items = state === 'empty' ? [] : invitations.filter(item => !answers[item.preview.meetingId] || answers[item.preview.meetingId] === 'maybe').map((item, index) => state === 'long' && index === 0 ? { ...item, preview: { ...item.preview, title: 'Большой вечер настольных игр, пиццы и разговоров до утра', place: 'Кафе «Соседи», второй этаж у окна', organizer: { id: 'lena', displayName: 'Александра Константинопольская' } } } : item)
  return { state, setState, items, answers }
}
