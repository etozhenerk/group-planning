import { TriangleAlert } from 'lucide-react'
import styles from '@preview/SubmissionNotice.module.css'
type SubmissionNoticeProps = { message:string; uncertain:boolean }
export const SubmissionNotice = ({message,uncertain}:SubmissionNoticeProps) => {
  if (!message) { return null }
  const known = message.startsWith('Не удалось создать встречу.')
  return <div className={styles.notice} role="alert" data-submission-notice>
    <span className={styles.icon} aria-hidden="true"><TriangleAlert size={18} strokeWidth={1.7}/></span>
    <div className={styles.copy}><strong>{uncertain ? 'Не удалось подтвердить создание' : known ? 'Не удалось создать встречу' : message}</strong>
      {(known || uncertain) && <span>{uncertain ? 'Повторите отправку — данные менять не нужно.' : 'Введённые данные остались в форме.'}</span>}
    </div>
  </div>
}
