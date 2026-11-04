import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { emptyDraft, draftInput } from '@/entities/meeting/model/draft'
import type { MeetingDraft } from '@/entities/meeting'
import { demoCover } from '@preview/demoCover'

export const useCreateMeeting = () => {
  const initial = new URLSearchParams(location.search).get('state') ?? 'empty'
  const stored = sessionStorage.getItem('somewhere-create-preview-draft')
  const blank = emptyDraft()
  const filled: MeetingDraft = { ...blank, title:'Ужин в пятницу', localTime:'2026-11-06T20:00', place:'Кафе «Соседи»', description:'Соберёмся после работы. Столик на шестерых.', cover:demoCover }
  const [scenario, setScenario] = useState(initial)
  const [value, setValue] = useState<MeetingDraft>(() => initial === 'validation' ? blank : initial === 'empty' ? stored ? JSON.parse(stored) : blank : filled)
  const [errors, setErrors] = useState<Record<string,string>>(initial === 'validation' ? {title:'required',starts_on:'required'} : {})
  const [problem, setProblem] = useState(initial === 'error' ? 'Не удалось создать встречу. Попробуйте ещё раз.' : initial === 'uncertain' ? 'Не удалось подтвердить создание. Повторите отправку.' : '')
  const [pending, setPending] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [uncertain, setUncertain] = useState(initial === 'uncertain')
  const [blocked, setBlocked] = useState(false)
  const lock = useRef(false)
  const cancel = () => { if (value.title || value.localTime || value.place || value.description || value.cover) { setBlocked(true) } else { location.href='../list-r1/frame.html?view=list' } }
  useEffect(() => { sessionStorage.setItem('somewhere-create-preview-draft', JSON.stringify(value)) }, [value])
  useEffect(() => {
    const receive = (event:MessageEvent) => {
      if (event.source !== parent || event.data?.type !== 'create-preview-state') { return }
      const next = event.data.value
      setScenario(next); setPending(false); setPreparing(false); setBlocked(false); setUncertain(next === 'uncertain'); setErrors(next === 'validation' ? { title:'required', starts_on:'required' } : {})
      setProblem(next === 'error' ? 'Не удалось создать встречу. Попробуйте ещё раз.' : next === 'uncertain' ? 'Не удалось подтвердить создание. Повторите отправку.' : '')
      setValue(next === 'empty' || next === 'validation' ? blank : filled)
      window.dispatchEvent(new CustomEvent('preview-reset'))
    }
    window.addEventListener('message', receive)
    window.addEventListener('preview-cancel', cancel)
    return () => { window.removeEventListener('message', receive); window.removeEventListener('preview-cancel', cancel) }
  }, [value])
  const change = (next:MeetingDraft) => { if (!pending && !uncertain) { setValue(next); setErrors(previous => {
    const remaining = { ...previous }
    if (next.title.trim()) { delete remaining.title }
    if (next.localTime.split('T')[0]) { delete remaining.starts_on }
    return remaining
  }); setProblem('') } }
  const submit = (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (lock.current || pending || preparing) { return }
    const invalid:Record<string,string> = {}
    if (!value.title.trim()) { invalid.title='required' }
    if (!value.localTime.split('T')[0]) { invalid.starts_on='required' }
    setErrors(invalid)
    if (Object.keys(invalid).length) { requestAnimationFrame(()=>{
      const field=document.querySelector<HTMLElement>('[aria-invalid="true"]')
      field?.focus({preventScroll:true})
      field?.scrollIntoView({block:'center',behavior:'auto'})
    }); return }
    try { draftInput(value) } catch (error) { setProblem(error instanceof Error ? error.message : 'Проверьте дату и время.'); return }
    lock.current=true; setPending(true); setProblem('')
    window.setTimeout(() => {
      setPending(false); lock.current=false
      if (scenario === 'error') { setProblem('Не удалось создать встречу. Попробуйте ещё раз.'); setScenario('filled'); return }
      sessionStorage.removeItem('somewhere-create-preview-draft')
      window.dispatchEvent(new CustomEvent('preview-created', { detail:value }))
    }, 500)
  }
  return { value, change, submit, pending, preparing, setPreparing, uncertain, locked:pending || preparing || uncertain, errors, problem, cancel, unsaved:{ blocked, stay:()=>setBlocked(false), leave:()=>{ location.href='../list-r1/frame.html?view=list' } } }
}
