import type {FeedEntry,Reaction} from '@/entities/meeting'
import type {Session} from '@/entities/session'
import type {ConversationSurface} from '@/widgets/conversation/model/useConversationSurface'
import {useEntrySurface} from '@/widgets/conversation/ui/FeedRecord/hooks/useEntrySurface'
import {useReactionGesture} from '@/widgets/conversation/ui/FeedRecord/hooks/useReactionGesture'
import {FeedMessageContent} from '@/widgets/conversation/ui/FeedMessageContent'
import {Avatar} from '@/shared/ui/Avatar'
import {MessageDelivery,MessagePendingIndicator} from '@/features/send-message'
import {MessageReactions} from '@/features/message-reactions'
import {ReadersDialog} from '@/widgets/conversation/ui/ReadersDialog'
import {clockLabel} from '@/shared/lib/time'
import {ErrorIndicator} from '@preview/ErrorIndicator'
import {MessageReceipt} from '@preview/MessageReceipt'
import {MessageMenu} from '@preview/MessageMenu'
import {changeOutgoing} from '@/features/send-message/model/changeOutgoing'
import {useChatModel} from '@preview/ChatContext'
import styles from '@preview/PrototypeMessage.module.css'
export type FeedRecordProps={read?:{enabled:boolean;count:string|undefined;version:string|undefined};entry:FeedEntry;session:Session;reactions:Reaction[];surface:ConversationSurface}
export const PrototypeMessage=({read,entry,session,reactions,surface}:FeedRecordProps)=>{
 const model=useChatModel(),panel=useEntrySurface(surface,entry.id),interactive=entry.kind==='message'&&!entry.delivery,gesture=useReactionGesture(interactive||entry.delivery==='rejected',()=>panel.change(true)),own=entry.actor.id===session.user.id
 const simple=!entry.pollId&&!entry.attachments?.length
 const reactionsUI=interactive&&<MessageReactions id={entry.meetingId} entry={entry.id} session={session} reactions={reactions} open={panel.active} change={panel.change} people={panel.people} readers={own&&read?.enabled?panel.readers.show:undefined} anchor={gesture.anchor} boundary={surface.boundary} context={entry.text??'Вложение'}/>
 const metadata=<span className={styles.meta}><time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>{own&&(entry.delivery?<MessagePendingIndicator state={entry.delivery} createdAt={entry.occurredAt}/>:<MessageReceipt count={read?.count} show={()=>panel.change(true)}/>)}</span>
 return <li className={styles.message} data-own={own} data-active={panel.active} data-testid="feed-message" data-delivery={entry.delivery??'accepted'}>
  <Avatar name={entry.actor.displayName} own={own} size="mobile-chat"/>
  <div className={styles.content}>
   <div ref={gesture.anchor} className={styles.target} data-simple={simple} tabIndex={interactive||entry.delivery==='rejected'?0:undefined} role={interactive||entry.delivery==='rejected'?'group':undefined} aria-label={interactive||entry.delivery==='rejected'?'Действия с сообщением: '+(entry.text??'Вложение'):undefined} aria-haspopup={interactive?'dialog':undefined} aria-expanded={panel.active} {...gesture.events} onDoubleClick={event=>{if(interactive&&!(event.target as Element).closest('button')){model.react(entry.id,'👍')}}}>
    <FeedMessageContent entry={entry} session={session} own={own}>
     <div className={styles.bubble} data-testid="message-bubble">{!own&&<strong className={styles.author}>{entry.actor.displayName}</strong>}<p>{entry.text??entry.event}</p><div className={styles.foot}>{reactionsUI}{metadata}</div></div>
    </FeedMessageContent>
   </div>
   {!simple&&reactionsUI}
   {!simple&&<div className={styles.attachmentMeta}>{!own&&<span>{entry.actor.displayName}</span>}{metadata}</div>}

   {entry.delivery==='rejected'&&<ErrorIndicator open={panel.active} show={()=>panel.change(true)}/>}
   {entry.delivery==='uncertain'&&entry.clientRequestId&&<MessageDelivery user={session.user.id} meeting={entry.meetingId} id={entry.clientRequestId} state={entry.delivery}/>}
   {entry.delivery==='rejected'&&entry.clientRequestId&&<MessageMenu open={panel.active} change={panel.change} choose={()=>undefined} pending={false} anchor={gesture.anchor} boundary={surface.boundary} context={entry.text??''} selected={[]} failed={{restoreDisabled:!!model.text.trim(),retry:()=>{void changeOutgoing(session.user.id,entry.meetingId,entry.clientRequestId!,'retry');panel.change(false)},restore:()=>{void changeOutgoing(session.user.id,entry.meetingId,entry.clientRequestId!,'restore');panel.change(false)}}}/>}
   {interactive&&own&&read?.enabled&&<ReadersDialog meeting={entry.meetingId} user={session.user.id} entry={entry.id} version={read.version} open={panel.readers.open} close={panel.readers.close} anchor={gesture.anchor}/>}
  </div>
 </li>
}
