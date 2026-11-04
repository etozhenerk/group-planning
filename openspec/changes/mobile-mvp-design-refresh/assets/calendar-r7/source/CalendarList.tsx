import { MeetingCard } from '@/entities/meeting/ui/MeetingCard'
import type { CalendarMeeting } from '@/entities/meeting'
import { user } from './data'
import styles from './CalendarList.module.css'

type CalendarListProps = { meetings: CalendarMeeting[] }

export const CalendarList = ({ meetings }: CalendarListProps) => <div className={styles.list}>
  {meetings.length === 0 && <p className={styles.empty}>Встреч пока нет</p>}
  {meetings.map((meeting, index) => <div key={meeting.id}>
    {(index === 0 || meeting.localDate?.slice(0, 7) !== meetings[index - 1]?.localDate?.slice(0, 7)) && <h2 className={styles.month}>{new Intl.DateTimeFormat('ru', { month: 'long' }).format(new Date(`${meeting.localDate}T12:00:00Z`))}</h2>}
    <div inert><MeetingCard meeting={meeting} user={user.user.id} past={meeting.period === 'past'} /></div>
  </div>)}
</div>
