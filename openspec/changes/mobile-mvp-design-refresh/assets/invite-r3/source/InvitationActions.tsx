import { useContext } from 'react'
import { Link } from 'react-router'
import { ResponseButtons } from '@/features/respond/ui/ResponseButtons'
import { SignInButton } from '@/features/sign-in/ui/SignInButton'
import { PreviewContext } from '@preview/PreviewContext'
import styles from '@preview/InvitationActions.module.css'
export const InvitationActions=()=>{
 const model=useContext(PreviewContext)
 if(!model){return null}
 return <section className={styles.panel} data-invitation-actions aria-label="Ответ на приглашение">
  {!model.signedIn ? <><p className={styles.hint}>Вход не подтверждает участие.</p><SignInButton context={{kind:'invitation',token:'preview-dinner'}} label="Войти через Яндекс ID"/></> : model.scenario==='organizer' ? <><p className={styles.hint}>Вы организуете эту встречу.</p><Link className={styles.open} to="/meetings/preview-dinner">Открыть встречу</Link></> : <><ResponseButtons key={model.scenario} session={{user:{id:'misha',displayName:'Миша'},expiresAt:'2027-01-01T00:00:00Z',csrf:null}} id="preview-dinner" token="preview-dinner" expected="1" current={model.answer} joinDisabledReason={model.scenario.startsWith('closed')?'Участие закрыто за час до начала встречи.':null}/></>}
 </section>
}
