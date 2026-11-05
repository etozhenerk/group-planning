import styles from '@/widgets/meeting-details/ui/MeetingDetails/MeetingDetails.module.css';
import type { RefObject } from 'react';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { DetailsPanels } from '@/widgets/meeting-details/ui/DetailsPanels';
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
  const mobile = useMobileLayout();
  const surface = useMeetingDetailsPanel(
    meeting.id,
    session.user.id,
    mobile ? 'О встрече' : meeting.title,
  );

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
        <DetailsPanels
          meeting={meeting}
          session={session}
          mobile={mobile}
          panel={panel}
          surface={surface}
        />
      </Dialog>
    </>
  );
};
