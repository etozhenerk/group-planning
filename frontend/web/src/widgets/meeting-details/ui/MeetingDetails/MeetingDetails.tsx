import styles from '@/widgets/meeting-details/ui/MeetingDetails/MeetingDetails.module.css';
import type { RefObject } from 'react';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { EditMeetingForm } from '@/features/edit-meeting';
import { ShareForm } from '@/features/share-invitation';
import { Dialog } from '@/shared/ui/Dialog';
import { useMobileLayout } from '@/shared/lib/media';
import { DetailsContent } from '@/widgets/meeting-details/ui/DetailsContent';
import { useMeetingDetailsPanel } from '@/widgets/meeting-details/ui/MeetingDetails/hooks/useMeetingDetailsPanel';

export type MeetingDetailsProps = {
  meeting: Meeting;
  session: Session;
  open: boolean;
  wide: boolean;
  close: () => void;
  show: () => void;
  returnFocus: RefObject<HTMLElement | null>;
};

export const MeetingDetails = ({
  meeting,
  session,
  open,
  wide,
  close,
  show,
  returnFocus,
}: MeetingDetailsProps) => {
  const surface = useMeetingDetailsPanel(meeting.id, session.user.id, meeting.title);
  const mobile = useMobileLayout();
  const panel = surface.panel ?? (open ? 'info' : null);

  return (
    <>
      {wide && (
        <aside
          className={styles['details-sidebar']}
          data-testid="details-sidebar"
          aria-hidden={panel !== null}
        >
          <DetailsContent
            meeting={meeting}
            session={session}
            close={close}
            edit={surface.edit}
            compact
            showAll={show}
          />
        </aside>
      )}
      <Dialog
        open={panel !== null}
        title={surface.title}
        onClose={surface.panel ? surface.close : close}
        chatAction
        formLayout
        returnFocus={returnFocus}
      >
        <div
          className={styles.content}
          data-mobile={mobile}
          hidden={panel !== 'info'}
          data-testid="meeting-info-scroll"
          ref={surface.info}
          tabIndex={-1}
        >
          <DetailsContent
            meeting={meeting}
            session={session}
            close={close}
            edit={surface.edit}
            share={surface.shareAction}
          />
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
          hidden={panel !== 'share'}
          ref={surface.share}
          tabIndex={-1}
        >
          {panel === 'share' && <ShareForm id={meeting.id} meeting={meeting} />}
        </div>
      </Dialog>
    </>
  );
};
