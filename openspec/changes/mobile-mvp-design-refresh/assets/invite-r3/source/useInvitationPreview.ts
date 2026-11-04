import { useEffect, useRef, useState } from 'react'
import type { Answer } from '@/shared/api'
export const useInvitationPreview = () => {
  const initial = new URLSearchParams(location.search).get('state') ?? 'guest'
  const [scenario,setScenario] = useState(initial)
  const [signedIn,setSignedIn] = useState(!['guest','auth-error'].includes(initial))
  const [answer,setAnswer] = useState<Answer|null>((initial==='member'||initial==='closed-member')?'going':initial==='maybe'||initial==='response-error'?'maybe':null)
  const [saved,setSaved] = useState<Answer|null>(null)
  const [responseBusy,setResponseBusy] = useState(false)
  const [responseError,setResponseError] = useState(initial==='response-error'?'Не удалось отправить ответ':'')
  const [loginBusy,setLoginBusy] = useState(false)
  const [loginError,setLoginError] = useState(initial==='auth-error'?'Не удалось открыть вход':'')
  const lock=useRef(false)
  const loginLock=useRef(false)
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.source!==parent||event.data?.type!=='invitation-preview-state'){return}
      const next=event.data.value
      setScenario(next);setSignedIn(!['guest','auth-error'].includes(next));setAnswer((next==='member'||next==='closed-member')?'going':next==='maybe'||next==='response-error'?'maybe':null)
      setSaved(null);setResponseBusy(false);setResponseError(next==='response-error'?'Не удалось отправить ответ':'');setLoginBusy(false);setLoginError(next==='auth-error'?'Не удалось открыть вход':'')
    }
    window.addEventListener('message',receive)
    return()=>window.removeEventListener('message',receive)
  },[])
  const signIn=()=>{
    if(loginLock.current){return}
    loginLock.current=true;setLoginBusy(true);setLoginError('')
    window.setTimeout(()=>{setLoginBusy(false);loginLock.current=false;setSignedIn(true)},450)
  }
  const respond=(next:Answer,options?:{onSuccess?:()=>void})=>{
    if(lock.current){return}
    lock.current=true;setResponseBusy(true);setResponseError('')
    window.setTimeout(()=>{setAnswer(next);setSaved(next);setResponseBusy(false);lock.current=false;options?.onSuccess?.()},450)
  }
  return {scenario,signedIn,answer,saved,responseBusy,responseError,loginBusy,loginError,signIn,respond,logout:()=>{setSignedIn(false);setAnswer(null);setSaved(null);setResponseError('')},retry:()=>{setScenario('guest');setSignedIn(false);setAnswer(null)}}
}
