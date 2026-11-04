import {MessageCircle} from 'lucide-react'
import {unreadLabel} from '@/entities/meeting/lib/unreadLabel'
import styles from './UnreadNotice.module.css'

type UnreadNoticeProps={count:string|undefined}

export const UnreadNotice=({count}:UnreadNoticeProps)=>{
 const value=BigInt(count??'0')
 if(value<=0n)return null
 const display=value>99n?'99+':count
 const adjective=value<=99n&&value%10n===1n&&value%100n!==11n?'непрочитанное':'непрочитанных'
 return <span className={styles.notice} aria-label={unreadLabel(count!)} title={unreadLabel(count!)} data-unread-notice><MessageCircle size={14} strokeWidth={1.6} aria-hidden="true"/><span>{display} {adjective}</span></span>
}
