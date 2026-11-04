import type { CSSProperties } from 'react'
import { Plus, List, CalendarDays } from 'lucide-react'
import { Brand } from '@/shared/ui/Brand'
import { usePeriodTabs } from './usePeriodTabs'
import styles from './MeetingsHeader.module.css'

type MeetingsHeaderProps = {
  period: 'upcoming' | 'past'
  view: 'calendar' | 'list'
  counts: { upcoming: number; past: number }
  changePeriod: (period: 'upcoming' | 'past') => void
  toggleView: () => void
}

export const MeetingsHeader = ({ period, view, counts, changePeriod, toggleView }: MeetingsHeaderProps) => {
  const { tabs, indicator } = usePeriodTabs(period, counts.upcoming + counts.past)
  return <header className={styles.header}>
    <div className={styles.brand}><Brand variant="header" /></div>
    <div className={styles.heading}><h1>Мои встречи</h1><button className={styles.create} type="button" aria-label="Создать встречу"><Plus size={17} />Создать</button></div>
    <div className={styles.toolbar}>
      <nav ref={tabs} className={styles.periods} aria-label="Период встреч" style={{ '--indicator-left': `${indicator.left}px`, '--indicator-width': `${indicator.width}px` } as CSSProperties}>
        <span className={styles.underline} aria-hidden="true" />
        <button type="button" aria-pressed={period === 'upcoming'} onClick={() => changePeriod('upcoming')}>Предстоящие <span>{counts.upcoming}</span></button>
        <button type="button" aria-pressed={period === 'past'} onClick={() => changePeriod('past')}>Прошедшие <span>{counts.past}</span></button>
      </nav>
      <div className={styles.viewControl}><button className={styles.viewButton} type="button" data-view-switch aria-label={view === 'calendar' ? 'Показать список' : 'Показать календарь'} title={view === 'calendar' ? 'Список' : 'Календарь'} onClick={toggleView}>{view === 'calendar' ? <List size={20} /> : <CalendarDays size={20} />}</button></div>
    </div>
  </header>
}
