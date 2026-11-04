import {useEffect} from 'react'
import { useLocation,useNavigate } from 'react-router'
import {LogoutButton} from '@/features/sign-in/ui/LogoutButton'
import { CloudOff,ArrowLeft,RotateCw } from 'lucide-react'
import { Brand } from '@/shared/ui/Brand'
import { Avatar } from '@/shared/ui/Avatar'
import { MeetingCover } from '@/entities/meeting/ui/MeetingCover'
import { MeetingFacts } from '@/entities/meeting/ui/MeetingFacts'
import { SkeletonDetails } from '@/shared/ui/SkeletonDetails'
import { useInvitationPreview } from '@preview/useInvitationPreview'
import { PreviewContext } from '@preview/PreviewContext'
import {InvitationClosed} from '@preview/InvitationClosed'
import { InvitationActions } from '@preview/InvitationActions'
import { useInvitationFooter } from '@preview/useInvitationFooter'
import { ChatPreview } from '@preview/ChatPreview'
import styles from '@preview/InvitationPreview.module.css'
export const InvitationPreview=()=>{
 const model=useInvitationPreview()
 const path=useLocation().pathname
 const navigate=useNavigate()
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{if(event.source===parent&&event.data?.type==='invitation-preview-state'){void navigate('/i/preview-dinner')}}
  window.addEventListener('message',receive)
  return()=>window.removeEventListener('message',receive)
 },[navigate])
 const chatting=model.signedIn&&path.startsWith('/meetings/')&&(model.answer==='going'||model.scenario==='organizer')
 const screen=useInvitationFooter(model.scenario+'-'+model.signedIn+'-'+model.answer+'-'+chatting)
 const organizer=model.scenario==='organizer'?'Миша':'Лена'
 const missing=model.scenario==='unavailable'
 const loading=model.scenario==='loading'
 const blocked=model.scenario.startsWith('closed')&&model.answer!=='going'
 const title=model.scenario==='long'?'Большой вечер настольных игр, пиццы и разговоров до утра':'Ужин в пятницу'
 return <PreviewContext.Provider value={model}>{chatting?<ChatPreview title={title} organizer={model.scenario==='organizer'}/>:<div className={styles.screen} ref={screen} data-invitation-preview>
  <header className={styles.header}><Brand variant="header"/>{model.signedIn&&<div className={styles.account}><span role="img" aria-label="Аккаунт: Миша" title="Миша"><Avatar name="Миша" size="small" tone="sand"/></span><LogoutButton session={{user:{id:"misha",displayName:"Миша"},expiresAt:"2027-01-01T00:00:00Z",csrf:null}}/></div>}</header>
  <main className={styles.scroll} data-invitation-scroll>
   {loading?<SkeletonDetails label="Загрузка приглашения"/>:missing?<section className={styles.unavailable}><span className={styles.unavailableIcon}><CloudOff size={32} strokeWidth={1.5}/></span><h1>Приглашение недоступно</h1><button onClick={model.retry}><RotateCw size={16}/>Повторить загрузку</button></section>:<>
    {model.scenario!=='no-cover'&&<div className={styles.hero}><MeetingCover fill url="/dinner" meeting="preview-dinner"/></div>}
    <p className={styles.eyebrow}>Приглашение на встречу</p><h1>{title}</h1>
    <div className={styles.organizer}><Avatar name={organizer} size="small" tone="lilac"/><span>Приглашает <strong>{organizer}</strong></span></div>
    {blocked&&<InvitationClosed answer={model.saved}/>}
    <div className={styles.facts}><MeetingFacts startsAt={model.scenario==='no-time'?null:'2026-11-06T17:00:00Z'} startsOn="2026-11-06" timezone="Europe/Moscow" place="Кафе «Соседи», Покровка, 8"/></div>
    <section className={styles.description} aria-label="Описание встречи"><p>Соберёмся после работы: поужинаем и поболтаем. Столик на шестерых уже забронирован.</p>{model.scenario==='long'&&<p>Если освободитесь позже, напишите Лене. Можно присоединиться к нам в течение вечера.</p>}</section>
    <a className={styles.return} href={model.signedIn?"../invitations-r1/frame.html":"../r5/frame.html"}><ArrowLeft size={15}/>{model.signedIn?"К приглашениям":"О somewhere"}</a>
   </>}
  </main>
  {!missing&&!loading&&!blocked&&<InvitationActions/>}
 </div>}</PreviewContext.Provider>
}
