import {useEffect,useLayoutEffect,useRef,useState,Fragment} from 'react'
import {MeetingHeader} from '@/pages/meeting/ui/MeetingHeader'
import {FeedEntryRecord} from '@/widgets/conversation/ui/FeedEntryRecord'
import {useConversationSurface} from '@/widgets/conversation/model/useConversationSurface'
import {UnreadDivider} from '@/widgets/conversation/ui/UnreadDivider'
import {ActionMenu} from '@/widgets/conversation/ui/ActionMenu'
import {SendMessage} from '@/features/send-message/ui/SendMessage'
import {ChatIcon} from '@/shared/ui/ChatIcon'
import {SkeletonConversation} from '@/shared/ui/SkeletonConversation'
import {useChatPreview} from '@preview/useChatPreview'
import {ChatContext} from '@preview/ChatContext'
import {ChatDialogs} from '@preview/ChatDialogs'
import {meetingDescription} from '@/pages/meeting/ui/MeetingConversation/lib/meetingDescription'
import {formModes} from '@preview/pollFixtures'
import {meeting,user} from '@preview/data'
import styles from '@preview/ChatPreview.module.css'
import {useChatModel} from '@preview/ChatContext'
export const ChatScreen=()=>{
 const model=useChatModel(),meeting=model.details,user=model.session,surface=useConversationSurface(meeting.id,user.user.id)
 const [dialog,setDialog]=useState<string|null>(formModes.has(model.scenario)?'place':null),[bottom,setBottom]=useState(true),[dockHeight,setDockHeight]=useState(104)
 const detailsTrigger=useRef<HTMLButtonElement>(null),feed=useRef<HTMLDivElement>(null),dock=useRef<HTMLDivElement>(null),file=useRef<HTMLInputElement>(null),photo=useRef<HTMLInputElement>(null),nearBottom=useRef(true)
 const close=()=>setDialog(null)
 useEffect(()=>{const reset=()=>{setDialog(null);surface.setPanel(null);nearBottom.current=true};const mode=(event:Event)=>setDialog(formModes.has((event as CustomEvent<string>).detail)?'place':null);window.addEventListener('date-preview-mode',mode);window.addEventListener('chat-close-surfaces',reset);return()=>{window.removeEventListener('chat-close-surfaces',reset);window.removeEventListener('date-preview-mode',mode)}},[])
 useLayoutEffect(()=>{if(!dock.current){return}const observer=new ResizeObserver(([entry])=>setDockHeight(entry.borderBoxSize[0]?.blockSize??entry.contentRect.height));observer.observe(dock.current);return()=>observer.disconnect()},[model.scenario])
 useLayoutEffect(()=>{if(nearBottom.current&&feed.current){feed.current.scrollTop=feed.current.scrollHeight}},[model.entries,dockHeight,model.scenario])
 const show=(kind:string)=>{surface.setPanel(null);if(kind==='photo'){photo.current?.click()}else if(kind==='file'){file.current?.click()}else{setDialog(kind)}}
 const denied=model.scenario==='denied',error=model.scenario==='error',loading=model.scenario==='loading'
 return <div className={styles.screen} ref={surface.boundary}>
  <div className={styles.status} aria-hidden="true"/>
  <MeetingHeader id={meeting.id} title={meeting.title} description={meetingDescription(meeting,true)+'\n'+meeting.place} organizer={false} empty={model.entries.length===0} detailsTrigger={detailsTrigger} showDetails={()=>{surface.setPanel(null);setDialog('details')}}/>
  <div className={styles.feed} ref={feed} style={{paddingBottom:denied||error||loading?24:dockHeight+22}} onScroll={()=>{const el=feed.current!;nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<60;setBottom(nearBottom.current);if(nearBottom.current){model.setIncoming(0)}}}>
   {loading?<SkeletonConversation/>:denied?<div className={styles.state}><div className={styles.stateIcon}><ChatIcon name="people" size={28}/></div><h2>Переписка закрыта</h2><p>Чат доступен участникам встречи.<br/>Чтобы присоединиться, выберите «Приду» в приглашении.</p><a href="../invite-r3/frame.html?state=ready">Открыть приглашение <span>↗</span></a></div>:error?<div className={styles.state}><div className={styles.stateIcon}><ChatIcon name="calendar" size={28}/></div><h2>Чат не загрузился</h2><p>Не удалось получить сообщения.<br/>Попробуйте ещё раз.</p><button onClick={()=>model.setScenario('ready')}>Повторить загрузку <span>↻</span></button></div>:model.entries.length===0?<div className={styles.state}><div className={styles.stateIcon}><ChatIcon name="calendar" size={28}/></div><h2>Кто начнёт?</h2><p>Можно обсудить планы<br/>или просто поздороваться.</p></div>:<><ul className={styles.messages}>{model.entries.map(entry=><Fragment key={entry.id}>{model.scenario==='unread'&&entry.id==='msg-2'&&<UnreadDivider/>}<FeedEntryRecord entry={entry} session={user} reactions={model.reactions[entry.id]??[]} surface={surface} read={{enabled:entry.id==='own-1'||entry.id==='own-unread',count:entry.id==='own-1'?(model.scenario==='not-read'?'0':'3'):entry.id==='own-unread'?'0':undefined,version:'1'}}/></Fragment>)}</ul></>}
  </div>
  {!denied&&!error&&!loading&&<><div ref={dock} className={styles.dock} data-testid="chat-dock">
   {!bottom&&model.incoming>0&&<button className={styles.jump} onClick={()=>{nearBottom.current=true;feed.current!.scrollTo({top:feed.current!.scrollHeight,behavior:'smooth'});setBottom(true);model.setIncoming(0)}}>К новым сообщениям ↓</button>}
   <SendMessage id={meeting.id} session={user} emojiOpen={surface.panel==='emoji'} toggleEmoji={()=>surface.setPanel(surface.panel==='emoji'?null:'emoji')} extraAction={<div className={styles.addWrap}><button className={styles.add} aria-label="Добавить к встрече" aria-expanded={surface.panel==='add'} onClick={()=>surface.setPanel(surface.panel==='add'?null:'add')} type="button"><ChatIcon name="plus" size={24}/></button><ActionMenu open={surface.panel==='add'} select={show}/></div>}/>
   <div className={styles.home} aria-hidden="true"/>
  </div><input ref={photo} hidden type="file" accept="image/*" onChange={event=>{const value=event.target.files?.[0];if(value){model.attach(value,true)}event.target.value=''}}/><input ref={file} hidden type="file" onChange={event=>{const value=event.target.files?.[0];if(value){model.attach(value,false)}event.target.value=''}}/></>}
  <ChatDialogs kind={dialog} close={close}/>
 </div>
}
