import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { EditMeetingForm } from '@/features/edit-meeting';
import { ShareForm } from '@/features/share-invitation';
import { DetailsContent } from '@/widgets/meeting-details/ui/DetailsContent';
import { DetailsResponse } from '@/widgets/meeting-details/ui/DetailsResponse';
import { InfoFooter } from '@/widgets/meeting-details/ui/InfoFooter';
import type { useMeetingDetailsPanel } from '@/widgets/meeting-details/ui/MeetingDetails/hooks/useMeetingDetailsPanel';
import styles from '@/widgets/meeting-details/ui/DetailsPanels/DetailsPanels.module.css';

export type DetailsPanelsProps = {
  meeting: Meeting;
  session: Session;
  mobile: boolean;
  panel: string | null;
  surface: ReturnType<typeof useMeetingDetailsPanel>;
};

export const DetailsPanels = ({
  meeting,
  session,
  mobile,
  panel,
  surface,
}: DetailsPanelsProps) => (
  <>
    {mobile && panel !== 'info' && (
      <button type="button" className={styles.back} onClick={surface.close}>
        ← К деталям встречи
      </button>
    )}
    <div className={styles.information} data-mobile={mobile} hidden={panel !== 'info'}>
      <div
        className={styles.content}
        data-mobile={mobile}
        data-testid="meeting-info-scroll"
        ref={surface.info}
        tabIndex={-1}
      >
        <DetailsContent
          meeting={meeting}
          session={session}
          edit={surface.edit}
          share={surface.shareAction}
        />
      </div>
      {mobile && (
        <InfoFooter
          meeting={meeting}
          session={session}
          share={surface.shareAction}
          respond={surface.responseAction}
        />
      )}
    </div>
    <div
      className={styles.form}
      hidden={panel !== 'settings'}
      ref={surface.settings}
      tabIndex={-1}
    >
      {(surface.visited || panel === 'settings') && (
        <EditMeetingForm
          key={surface.generation}
          meeting={meeting}
          session={session}
          onSaved={surface.saved}
        />
      )}
    </div>
    <div
      className={styles.content}
      data-mobile={mobile}
      hidden={panel !== 'share'}
      ref={surface.share}
      tabIndex={-1}
    >
      {panel === 'share' && <ShareForm id={meeting.id} meeting={meeting} />}
    </div>
    <div
      className={styles.content}
      data-mobile={mobile}
      hidden={panel !== 'response'}
      ref={surface.response}
      tabIndex={-1}
    >
      {panel === 'response' && <DetailsResponse meeting={meeting} session={session} />}
    </div>
  </>
);
