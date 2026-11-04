import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { CreateMeetingForm } from '@/features/create-meeting/ui/CreateMeetingForm'
import type { MeetingDraft } from '@/entities/meeting'
import { useCreateFooter } from '@preview/useCreateFooter'
import { NextChat } from '@preview/NextChat'
import styles from '@preview/CreatePreview.module.css'

export const CreatePreview = () => {
  const [created, setCreated] = useState<MeetingDraft | null>(null)
  const screen = useCreateFooter(!!created)
  useEffect(() => {
    const success = (event:Event) => setCreated((event as CustomEvent<MeetingDraft>).detail)
    const reset = () => setCreated(null)
    const receive = (event:MessageEvent) => {
      if (event.source === parent && event.data?.type === 'create-preview-state') {
        history.replaceState(null, '', location.pathname + '?state=' + encodeURIComponent(event.data.value))
        setCreated(null)
      }
    }
    window.addEventListener('preview-created', success)
    window.addEventListener('preview-reset', reset)
    window.addEventListener('message', receive)
    return () => { window.removeEventListener('preview-created', success); window.removeEventListener('preview-reset', reset); window.removeEventListener('message', receive) }
  }, [])
  return created ? <NextChat draft={created} /> : <div ref={screen} className={styles.screen}>
    <header className={styles.header}>
      <button className={styles.back} onClick={()=>window.dispatchEvent(new Event('preview-cancel'))}><ArrowLeft size={19} aria-hidden="true" />Мои встречи</button>
      <h1>Новая встреча</h1>
      <p><span className={styles.required}>*</span> — обязательные поля</p>

    </header>
    <main className={styles.scroll} data-create-scroll><CreateMeetingForm session={{user:{id:'misha',displayName:'Миша'},expiresAt:'2027-01-01T00:00:00Z',csrf:null}} /></main>
  </div>
}
