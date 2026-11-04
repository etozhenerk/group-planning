import { CloudOff, RotateCw } from 'lucide-react'
import { CalendarGrid } from '@/pages/meetings/ui/CalendarGrid'
import { MeetingsHeader } from './MeetingsHeader'
import { CalendarList } from './CalendarList'
import { SkeletonRows } from '@/shared/ui/SkeletonRows'
import { Navigation } from '@/widgets/navigation/ui/Navigation'
import { CalendarAgenda } from './CalendarAgenda'
import { useCalendarPreview } from './useCalendarPreview'
import { user, undated } from './data'
import { MeetingCard } from '@/entities/meeting/ui/MeetingCard'
import styles from './CalendarScreen.module.css'

export const CalendarScreen = () => {
  const model = useCalendarPreview()
  return <div className={styles.screen} data-calendar-preview>
    <MeetingsHeader period={model.period} view={model.view} counts={model.counts} changePeriod={model.changePeriod} toggleView={model.toggleView} />
    <main ref={model.scroll} className={styles.scroll} data-calendar-scroll>
      {model.state === 'loading' ? <SkeletonRows label="Загрузка календаря" /> : model.state === 'error' ? <section className={styles.error} role="alert"><div className={styles.errorIcon}><CloudOff size={34} strokeWidth={1.5} aria-hidden="true" /></div><h2>Не удалось загрузить встречи</h2><button className={styles.retry} onClick={() => model.setState('ready')}><RotateCw size={17} />Повторить загрузку</button></section> : <>
        {model.view === 'calendar' && <div className={styles.calendarSurface}><CalendarGrid day={model.day} page={model.page} onSelect={model.setDay} /></div>}
        {model.view === 'calendar' ? <CalendarAgenda day={model.day} meetings={model.visible} list={false} /> : <CalendarList meetings={model.visible} />}
        {model.state !== 'empty' && <button type="button" className={styles.undated} onClick={() => model.setState(model.state === 'undated' ? 'ready' : 'undated')}>Без даты <span>1</span><span aria-hidden="true">→</span></button>}
        {model.state === 'undated' && <div className={styles.undatedDetail} inert><MeetingCard meeting={undated[0]!} user={user.user.id} past={false} /></div>}
      </>}
    </main>
    <div className={styles.navigationFrame} inert><Navigation session={user} /></div>
  </div>
}
