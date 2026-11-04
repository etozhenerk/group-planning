import { useEffect, useRef, useState } from 'react'
import { upcoming, past } from './data'
import { crowdedDay } from './crowdedDay'

export const useCalendarPreview = () => {
  const [day, setDay] = useState('2026-11-06')
  const [state, setState] = useState(new URLSearchParams(location.search).get('state') ?? 'ready')
  const [view, setView] = useState<'calendar' | 'list'>((new URLSearchParams(location.search).get('view') ?? (location.pathname.includes('/list-r1/') ? 'list' : 'calendar')) === 'list' ? 'list' : 'calendar')
  const [period, setPeriod] = useState<'upcoming' | 'past'>('upcoming')
  const days = useRef({ upcoming: '2026-11-06', past: '2026-10-30' })
  const scroll = useRef<HTMLElement>(null)
  const positions = useRef({ calendar: 0, list: 0 })
  const changePeriod = (next: 'upcoming' | 'past') => {
    if (next === period) { return }
    days.current[period] = day
    setPeriod(next)
    setDay(days.current[next])
    positions.current = { calendar: 0, list: 0 }
    if (scroll.current) { scroll.current.scrollTop = 0 }
  }
  const toggleView = () => {
    positions.current[view] = scroll.current?.scrollTop ?? 0
    setView(view === 'calendar' ? 'list' : 'calendar')
  }
  useEffect(() => {
    if (scroll.current) { scroll.current.scrollTop = positions.current[view] }
  }, [view])
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== parent || event.data?.type !== 'list-preview-state') { return }
      setState(event.data.value)
      setDay(event.data.value === 'empty-day' ? '2026-11-09' : '2026-11-06')
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [])
  const meetings = state === 'twenty' ? [...past, ...upcoming.filter(item => item.localDate !== '2026-11-06'), ...crowdedDay] : state === 'empty' ? [] : [...past, ...upcoming].map(item => state === 'long' && item.id === 'dinner' ? { ...item, title: 'Большой вечер настольных игр, пиццы и разговоров до утра', place: 'Кафе «Соседи», второй этаж у окна' } : item)
  if (state === 'multiple') { meetings.push({ ...upcoming[2]!, id: 'coffee-evening', title: 'Кофе после работы', startsAt: '2026-11-06T15:00:00Z', startsOn: '2026-11-06', localDate: '2026-11-06' }) }
  const filtered = meetings.filter(item => item.period === period)
  const counts = { upcoming: meetings.filter(item => item.period === 'upcoming').length, past: meetings.filter(item => item.period === 'past').length }
  const visible = filtered.filter(item => view === 'list' || item.localDate === day).sort((a, b) => (a.startsAt ?? '').localeCompare(b.startsAt ?? ''))
  const page = { meetings: filtered, days: [...new Set(filtered.map(item => item.localDate).filter((date): date is string => !!date))].map(date => ({ date, count: filtered.filter(item => item.localDate === date).length })), counts: { upcoming: 4, past: 1, undated: 1 }, asOf: '2026-11-03T12:00:00Z', nextCursor: null, nextTransitionAt: null, refreshAfterSeconds: 60 }
  return { day, setDay, state, setState, view, toggleView, period, changePeriod, counts, scroll, visible, page }
}
