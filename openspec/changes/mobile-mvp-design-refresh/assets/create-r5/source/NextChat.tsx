import { useRef } from 'react'
import { MeetingHeader } from '@/pages/meeting/ui/MeetingHeader'
import { InvitePrompt } from '@/widgets/conversation/ui/InvitePrompt'
import type { MeetingDraft } from '@/entities/meeting'
import styles from '@preview/NextChat.module.css'
type NextChatProps = { draft:MeetingDraft }
export const NextChat = ({draft}:NextChatProps) => {
  const details = useRef<HTMLButtonElement>(null)
  return <div className={styles.screen} data-created-chat>
    <div inert><MeetingHeader id="preview-created" title={draft.title} description="Вы организатор · 1 участник" organizer empty showDetails={()=>undefined} detailsTrigger={details} /></div>
    <div className={styles.body}><p className={styles.event}>Миша создал встречу</p><div inert><InvitePrompt id="preview-created" /></div></div>
    <div className={styles.composer} inert><input aria-label="Сообщение" placeholder="Сообщение" /></div>
  </div>
}
