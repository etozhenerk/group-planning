import {useRef,useState} from 'react'
import type {RefObject} from 'react'
import type {Reaction,PreparationTask,PreparationAction,PollAction,PlaceVoteInput} from '@/entities/meeting'
import {taskActions} from '@/features/preparation-task/model/taskCopy'
import {useChatModel} from '@preview/ChatContext'
export const useSendMessage=()=>{const m=useChatModel();return {text:m.text,setText:m.setText,selection:m.selection,rememberSelection:m.setSelection,storageError:false,pending:[],submit:m.send,keyDown:m.keyDown,disabled:m.scenario==='denied'}}
export const useTaskControls=(task:PreparationTask|undefined)=>{const m=useChatModel();return {actions:task?taskActions(task):[],disabled:false,pending:undefined,problem:'',retryable:false,retry:()=>undefined,act:(action:PreparationAction,complete?:()=>void)=>{if(task){m.taskAct(task.id,action);complete?.()}}}}
export const usePollAction=()=>{const m=useChatModel(),[error,setError]=useState<Error|null>(null);return {isPending:m.voting,error,mutate:(action:PollAction,options?:{onSuccess?:()=>void})=>{setError(null);m.vote(action,options?.onSuccess,setError)}}}
export const usePlaceVote=()=>{const m=useChatModel();return {isPending:false,error:null,variables:undefined,mutate:(action:PlaceVoteInput)=>m.setPlacePoll(previous=>({...previous,myVote:action.answer,myVoteRevision:String(Number(previous.myVoteRevision)+1),votesFor:previous.votesFor-(previous.myVote==='for'?1:0)+(action.answer==='for'?1:0),votesAgainst:previous.votesAgainst-(previous.myVote==='against'?1:0)+(action.answer==='against'?1:0)}))}}
export const useMessageReactions=(_id:string,entry:string,_session:unknown,reactions:Reaction[],change:(open:boolean)=>void,anchor:RefObject<HTMLElement|null>)=>{
 const m=useChatModel(),peopleTrigger=useRef<HTMLElement>(null),[peopleFilter,setPeopleFilter]=useState('')
 return {denied:false,displayed:m.reactions[entry]??reactions,mutation:{isPending:false,error:null},choose:(emoji:string)=>{m.react(entry,emoji);change(false)},peopleTrigger,peopleFilter,setPeopleFilter,returnFocus:anchor,retry:()=>undefined}
}
export const changeOutgoing=async(_user:string,_meeting:string,id:string,kind:string)=>{window.dispatchEvent(new CustomEvent('chat-outgoing',{detail:{id,kind}}))}
export const useDownload=(media:{download_url:string|null;file_name:string})=>({isPending:false,error:null,mutate:()=>{if(media.download_url){const link=document.createElement('a');link.href=media.download_url;link.download=media.file_name;link.click()}}})
