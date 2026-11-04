import { CalendarDays } from 'lucide-react'
import { MeetingCard } from '@/entities/meeting/ui/MeetingCard'
import type { CalendarMeeting } from '@/entities/meeting'
import { agendaLabel, meetingCountLabel } from '@/pages/meetings/lib/calendarDates'
import { user } from './data'
import styles from './CalendarAgenda.module.css'

type CalendarAgendaProps = { day: string; meetings: CalendarMeeting[]; list: boolean }

export const CalendarAgenda = ({ day, meetings, list }: CalendarAgendaProps) => (
  <section aria-label="Встречи выбранного дня" className={styles.agenda}>
    <div className={styles.heading}>
      <h2>{list ? 'Все встречи' : agendaLabel(day)}</h2>
      <span>{meetingCountLabel(meetings.length)}</span>
    </div>
    <div key={`${day}-${list}`} className={styles.cards}>
      {meetings.length ? meetings.map(meeting => <div key={meeting.id} inert><MeetingCard meeting={meeting} user={user.user.id} past={meeting.period === 'past'} /></div>) : <div className={styles.empty}><CalendarDays size={24} strokeWidth={1.5} aria-hidden="true" /><p>На этот день встреч нет</p></div>}
    </div>
  </section>
)
