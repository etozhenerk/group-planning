import styles from '@/entities/meeting/ui/DraftPreview/DraftPreview.module.css';
import { Sparkles } from 'lucide-react';
import type { MeetingDraft } from '@/entities/meeting/model/types';
import { draftPreview } from '@/entities/meeting/lib/draftPreview';
import { MeetingFacts } from '@/entities/meeting/ui/MeetingFacts';

export type DraftPreviewProps = { draft: MeetingDraft };

export const DraftPreview = ({ draft }: DraftPreviewProps) => {
  return (
    <aside className={styles['draft-preview']}>
      <h2>Приглашение для друзей</h2>
      <div className={[styles['panel'], styles['stack']].join(' ')}>
        <span className={styles['meeting-emblem']}>
          <Sparkles aria-hidden="true" size={24} />
        </span>
        <h3>{draft.title.trim() || 'Название встречи'}</h3>
        <MeetingFacts
          startsAt={draftPreview(draft)}
          timezone={draft.timezone}
          place={draft.place.trim() || null}
        />
      </div>
    </aside>
  );
};
