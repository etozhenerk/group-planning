import { useRef } from 'react'
import { Link } from 'react-router'
import { MeetingHeader } from '@/pages/meeting/ui/MeetingHeader'
import styles from '@preview/ChatPreview.module.css'
type ChatPreviewProps={title:string;organizer:boolean}
export const ChatPreview=({title,organizer}:ChatPreviewProps)=>{
 const trigger=useRef<HTMLButtonElement>(null)
 return <div className={styles.screen} data-chat-preview><div inert><MeetingHeader title={title} description={organizer?'Вы организатор':'Вы участвуете'} id="preview-dinner" organizer={organizer} empty showDetails={()=>undefined} detailsTrigger={trigger}/></div><main className={styles.body}><p>{organizer?'Миша создал встречу':'Миша присоединился к встрече'}</p><Link to="/i/preview-dinner">К приглашению</Link></main><div className={styles.composer} inert><input placeholder="Сообщение" aria-label="Сообщение"/></div></div>
}
