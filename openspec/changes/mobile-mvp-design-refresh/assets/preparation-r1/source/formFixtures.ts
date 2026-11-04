import {useState} from 'react'
import type {FormEvent} from 'react'
import type {Meeting,PollSettings} from '@/entities/meeting'
import type {Session} from '@/entities/session'
import {resolveTime} from '@/shared/lib/time'
import {pollDateErrors} from '@/features/date-poll/model/pollDateErrors'
import {useChatModel} from '@preview/ChatContext'
import {people} from '@preview/data'
export {useTaskForm} from '@preview/useTaskDraft'
const useOldPollForm=(meeting:Meeting,_session:Session,done:()=>void)=>{
 const model=useChatModel(),[dates,setDates]=useState(['2026-11-06','2026-11-07']),[attempt,setAttempt]=useState(0),[deadline,setDeadline]=useState('2026-11-05T21:00'),[choice,setChoice]=useState<''|'earlier'|'later'>(''),[problem,setProblem]=useState('')
 const [settings,setSettings]=useState<PollSettings>({multipleAnswers:true,allowRevoting:true,allowNewOptions:true,anonymous:false,hideResults:false})
 return {dates,attempt,dateErrors:attempt?pollDateErrors(dates):[],changeDate:(index:number,value:string)=>setDates(previous=>previous.map((date,i)=>i===index?value:date)),remove:(index:number)=>setDates(previous=>previous.filter((_,i)=>i!==index)),add:()=>setDates(previous=>previous.length<20?[...previous,'']:previous),deadline,setDeadline,choice,setChoice,settings,changeSetting:(key:keyof PollSettings,value:boolean)=>setSettings(previous=>({...previous,[key]:value})),pending:false,locked:false,uncertain:false,problem,submit:(event:FormEvent)=>{event.preventDefault();setAttempt(value=>value+1);if(pollDateErrors(dates).some(Boolean)){return}try{const closesAt=resolveTime(deadline,meeting.timezone,choice);if(!model.addPoll({dates,closesAt,settings})){setProblem('В чате уже есть открытый опрос о дате.');return}done()}catch{setProblem('Проверьте время окончания опроса.')}}}
}
export {usePlaceForm} from '@preview/usePlaceDraft'

export {usePollForm} from '@preview/useDateForm'
