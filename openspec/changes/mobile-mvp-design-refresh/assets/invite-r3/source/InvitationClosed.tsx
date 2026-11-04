import type {Answer} from '@/shared/api'
import {answerLabels} from '@/entities/meeting'
import {LockKeyhole} from 'lucide-react'
import styles from '@preview/InvitationClosed.module.css'
type InvitationClosedProps={answer?:Answer|null}
export const InvitationClosed=({answer}:InvitationClosedProps)=><div className={styles.closed} role="status"><span className={styles.icon} aria-hidden="true"><LockKeyhole size={18} strokeWidth={1.7}/></span><div><strong>Участие закрыто</strong><p>{answer ? `Вы ответили «${answerLabels[answer]}».` : "Новых участников больше не принимают."}</p></div></div>
