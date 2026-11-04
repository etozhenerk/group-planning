import {TriangleAlert} from 'lucide-react'
import styles from '@preview/InvitationNotice.module.css'
type InvitationNoticeProps={title:string;text:string;id?:string}
export const InvitationNotice=({title,text,id}:InvitationNoticeProps)=><div id={id} className={styles.notice} role="alert"><span className={styles.icon} aria-hidden="true"><TriangleAlert size={18} strokeWidth={1.7}/></span><div className={styles.copy}><strong>{title}</strong><span>{text}</span></div></div>
