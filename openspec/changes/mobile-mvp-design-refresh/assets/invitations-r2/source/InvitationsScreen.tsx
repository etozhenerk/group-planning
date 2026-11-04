import { ArrowLeft, CloudOff, Mail, RotateCw } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Brand } from '@/shared/ui/Brand'
import { Navigation } from '@/widgets/navigation/ui/Navigation'
import { InvitationCard } from '@/pages/invitations/ui/InvitationCard'
import { ResponseButtons } from '@/features/respond/ui/ResponseButtons'
import { SkeletonRows } from '@/shared/ui/SkeletonRows'
import { useInvitationsPreview } from '@preview/useInvitationsPreview'
import { invitations, user } from '@preview/data'
import styles from '@preview/InvitationsScreen.module.css'

export const InvitationsScreen = () => {
  const model = useInvitationsPreview()
  const location = useLocation()
  const selected = invitations.find(item => item.path === location.pathname)
  const detail = !!selected
  return <div className={styles.screen} data-invitations-preview data-detail={detail}>
    <header className={styles.header}>
      {detail ? <Link className={styles.back} to="/invitations"><ArrowLeft size={19} />Приглашения</Link> : <div className={styles.brand}><Brand variant="header" /></div>}
      <div className={styles.heading}><h1>{detail ? 'Ваш ответ' : 'Приглашения'}</h1>{!detail && !['loading', 'error'].includes(model.state) && <span className={styles.count}>{model.items.length}</span>}</div>
      {!detail && <p className={styles.explanation}>Здесь встречи, на которые вы ответили «Возможно». Откройте приглашение, чтобы изменить ответ.</p>}
    </header>
    <main className={styles.scroll} data-invitations-scroll>
      {detail ? <><div className={styles.selected} inert><InvitationCard item={selected} /></div><div className={styles.response}><ResponseButtons session={user} id={selected.preview.meetingId} expected="1" current={model.answers[selected.preview.meetingId] === 'going' ? 'going' : model.answers[selected.preview.meetingId] === 'not_going' ? 'not_going' : 'maybe'} inMeeting /></div></> : model.state === 'loading' ? <SkeletonRows label="Загрузка приглашений" /> : model.state === 'error' ? <section className={styles.statePanel} role="alert"><div className={styles.stateIcon}><CloudOff size={32} strokeWidth={1.5} aria-hidden="true" /></div><h2>Не удалось загрузить приглашения</h2><button className={styles.primary} onClick={() => model.setState('ready')}><RotateCw size={17} />Повторить загрузку</button></section> : <>
        {model.state === 'refresh-error' && <div className={styles.refreshError} role="alert"><CloudOff size={19} aria-hidden="true" /><span>Не удалось обновить приглашения</span><button aria-label="Повторить обновление" onClick={() => model.setState('ready')}><RotateCw size={18} /></button></div>}
        {model.items.length ? <div className={styles.items}>{model.items.map(item => <InvitationCard key={item.preview.meetingId} item={item} />)}</div> : <section className={styles.statePanel}><div className={styles.stateIcon}><Mail size={32} strokeWidth={1.5} aria-hidden="true" /></div><h2>Приглашений пока нет</h2><a className={styles.primary} href="../list-r1/frame.html?view=list">К моим встречам</a></section>}

      </>}
    </main>
    {!detail && <div className={styles.navigationFrame} inert><Navigation session={user} /></div>}
  </div>
}
