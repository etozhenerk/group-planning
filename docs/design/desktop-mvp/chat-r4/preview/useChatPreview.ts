import {useEffect,useRef,useState} from 'react'
import type {FormEvent,KeyboardEvent} from 'react'
import type {FeedEntry,PreparationTask,PreparationAction,Reaction,PollAction,PollCreate} from '@/entities/meeting'
import {responseEvents,baseEntries,message,meeting,taskSeed,pollSeed,placeSeed,reactionSeed,mediaSeed,people,fileSeed} from '@preview/data'
export const useChatPreview=()=>{
 const initial=new URLSearchParams(location.search).get('state')??'ready'
 const entriesFor=(mode:string):FeedEntry[]=>mode==='responses'?[...baseEntries.filter(item=>item.id!=='rsvp-confirmed'),...responseEvents]:mode==='empty'?[]:mode==='file'?[baseEntries[1]!,{...message('menu-file-entry','lena','',11),attachments:[fileSeed]},baseEntries[2]!]:mode==='own-file'?[baseEntries[1]!,baseEntries[2]!,{...message('own-file-entry','misha','',13),attachments:[{...fileSeed,uploaded_by:{id:'misha',display_name:'Миша',avatar_url:'./avatars/misha.jpg'}}]}]:mode==='photo'?[...baseEntries.slice(0,3),{...message('photo-entry','lena','Вот такой столик у окна.',16),attachments:[mediaSeed]}]:mode==='poll'?[...baseEntries.slice(0,3),{...message('poll-entry','lena','',16),pollId:pollSeed.id}]:mode==='place'?[...baseEntries.slice(0,3),{...message('place-entry','sasha','',16),placePollId:placeSeed.id}]:mode==='failed'?[...baseEntries,{...message('failed-1','misha','Я тоже возьму десерт.',17),clientRequestId:'failed-1',delivery:'rejected'}]:mode==='long'?[...baseEntries,message('long-1','sasha','Давайте встретимся у входа. Если вдруг задержусь на работе, напишу сюда — не ждите меня на улице. И ещё: у ребят на сайте было новое меню, хочу попробовать их большую пиццу с грибами. https://example.com/menu/очень-длинная-ссылка-на-меню',17)]:baseEntries
 const [scenario,setScenario]=useState(initial)
 const [entries,setEntries]=useState(entriesFor(initial))
 const [text,setText]=useState(()=>sessionStorage.getItem('somewhere-desktop-chat-r3-draft')??'')
 const [selection,setSelection]=useState({start:text.length,end:text.length})
 const [tasks,setTasks]=useState<Record<string,PreparationTask>>({[taskSeed.id]:taskSeed})
 const [poll,setPoll]=useState(pollSeed)
 const [placePoll,setPlacePoll]=useState(placeSeed)
 const [reactions,setReactions]=useState(reactionSeed)
 const [media,setMedia]=useState<Record<string,string>>({[mediaSeed.id]:'./dinner.png'})
 const [incoming,setIncoming]=useState(0)
 const generation=useRef(0)
 useEffect(()=>{sessionStorage.setItem('somewhere-desktop-chat-r3-draft',text)},[text])
 const resolve=(id:string)=>window.setTimeout(()=>setEntries(previous=>previous.map(entry=>entry.id===id?{...entry,delivery:undefined}:entry)),500)
 const retry=(id:string,kind:string)=>{
  const entry=entries.find(entry=>entry.id===id||entry.clientRequestId===id)
  if(!entry){return}
  if(kind==='restore'){setText(entry.text??'');setEntries(previous=>previous.filter(value=>value.id!==entry.id));return}
  setEntries(previous=>previous.map(value=>value.id===entry.id?{...value,delivery:'sending'}:value));resolve(entry.id)
 }
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(event.source!==parent){return}
   if(event.data?.type==='chat-preview-state'){
    generation.current++;const next=event.data.value;setScenario(next);setEntries(entriesFor(next));setTasks({[taskSeed.id]:taskSeed});setPoll(pollSeed);setPlacePoll(placeSeed);setReactions(reactionSeed);setIncoming(0)
    window.dispatchEvent(new CustomEvent('chat-close-surfaces'))
   }
   if(event.data?.type==='chat-incoming'){setEntries(previous=>[...previous,message('incoming-'+crypto.randomUUID(),'lena','Я уже уточнила: столик у окна.',18)]);setIncoming(value=>value+1)}
  }
  const change=(event:Event)=>{const detail=(event as CustomEvent<{id:string;kind:string}>).detail;retry(detail.id,detail.kind)}
  window.addEventListener('message',receive);window.addEventListener('chat-outgoing',change)
  return()=>{window.removeEventListener('message',receive);window.removeEventListener('chat-outgoing',change)}
 },[entries])
 const send=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(!text.trim()||scenario==='denied'){return}
  const id='sent-'+crypto.randomUUID()
  const entry={...message(id,'misha',text.trim(),19),occurredAt:new Date().toISOString(),clientRequestId:id,delivery:'sending' as const}
  setEntries(previous=>[...previous,entry]);setText('');setSelection({start:0,end:0});resolve(id)
 }
 const keyDown=(event:KeyboardEvent<HTMLTextAreaElement>)=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();event.currentTarget.form?.requestSubmit()}}
 const react=(entry:string,emoji:string)=>{
  setReactions(previous=>{
   const values=previous[entry]??[]
   const current=values.find(value=>value.emoji===emoji)
   const result=current?values.map(value=>value.emoji===emoji?{...value,mine:!value.mine,count:value.count+(value.mine?-1:1),users:value.mine?value.users.filter(person=>person.id!=='misha'):[...value.users,{id:'misha',display_name:'Миша',avatar_url:null}]}:value).filter(value=>value.count>0):[...values,{emoji,count:1,mine:true,users:[{id:'misha',display_name:'Миша',avatar_url:null}]}]
   return {...previous,[entry]:result}
  })
 }
 const taskAct=(id:string,action:PreparationAction)=>{
  setTasks(previous=>{const current=previous[id];if(!current){return previous}
   const self={id:'misha',displayName:'Миша',avatarUrl:null}
   return {...previous,[id]:{...current,state:action==='accept'?'accepted':action==='complete'?'completed':action==='decline'?'declined':'cancelled',assignee:action==='accept'?self:current.assignee,updatedBy:self,revision:String(Number(current.revision)+1),canAccept:false,canComplete:action==='accept',canDecline:action==='accept',canCancel:current.author.id==='misha'&&action!=='complete'}}
  })
 }
 const vote=(action:PollAction)=>{
  if(action.kind==='vote'){setPoll(previous=>({...previous,myOptionIds:action.optionIds,myVoteRevision:String(Number(previous.myVoteRevision)+1),options:previous.options.map(option=>({...option,votes:(option.votes??0)-(previous.myOptionIds.includes(option.id)?1:0)+(action.optionIds.includes(option.id)?1:0)}))}))}
  if(action.kind==='options'){setPoll(previous=>({...previous,options:[...previous.options,{id:'opt-'+crypto.randomUUID(),date:action.date,votes:0,voters:[]}]}))}
 }
 const addTask=(title:string,recipientId:string)=>{
  const id='task-'+crypto.randomUUID(),self={id:'misha',displayName:'Миша',avatarUrl:null},person=people.find(person=>person.id===recipientId)
  setTasks(previous=>({...previous,[id]:{...taskSeed,id,title,author:self,updatedBy:self,recipient:person?{id:person.id,displayName:person.display_name,avatarUrl:null}:null,createdAt:new Date().toISOString(),canCancel:true}}))
  setEntries(previous=>[...previous,{...message('entry-'+id,'misha','',20),occurredAt:new Date().toISOString(),taskId:id}])
 }
 const addPoll=(input:PollCreate)=>{
  if(entries.some(entry=>entry.pollId)){return false}
  setPoll({...pollSeed,author:{id:'misha',displayName:'Миша'},settings:input.settings,closesAt:input.closesAt,options:input.dates.map((date,index)=>({id:'new-date-'+index,date,votes:0,voters:[]}))})
  setEntries(previous=>[...previous,{...message('poll-created','misha','',20),occurredAt:new Date().toISOString(),pollId:pollSeed.id}]);return true
 }
 const addPlace=(name:string,explanation:string,closesAt:string)=>{
  setPlacePoll({...placeSeed,place:name,explanation,closesAt,votesFor:0,votesAgainst:0})
  setEntries(previous=>[...previous,{...message('place-created','misha','',20),occurredAt:new Date().toISOString(),placePollId:placeSeed.id}])
 }
 const attach=(file:File,photo:boolean)=>{
  const id='media-'+crypto.randomUUID(),url=URL.createObjectURL(file)
  setMedia(previous=>({...previous,[id]:url}))
  setEntries(previous=>[...previous,{...message(id,'misha','',20),occurredAt:new Date().toISOString(),attachments:[{...mediaSeed,id,file_name:file.name,content_type:file.type,size_bytes:file.size,kind:photo?'photo':'file',download_url:url,thumbnail_url:url,uploaded_by:{id:'misha',display_name:'Миша',avatar_url:null}}]}])
 }
 return {scenario,setScenario,entries,text,setText,selection,setSelection,send,keyDown,tasks,taskAct,poll,vote,placePoll,setPlacePoll,reactions,react,media,incoming,setIncoming,addTask,addPoll,addPlace,attach}
}
