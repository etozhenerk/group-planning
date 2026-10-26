import styles from '@/widgets/meeting-details/ui/MeetingDetails/MeetingDetails.module.css';
import { useEffect, useState } from 'react';
import { useDisclosure } from '@/shared/lib/disclosure';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { EditMeetingForm } from '@/features/edit-meeting';
import { Dialog } from '@/shared/ui/Dialog';
import { DetailsContent } from '@/widgets/meeting-details/ui/DetailsContent';

export type MeetingDetailsProps = {
  meeting: Meeting;
  session: Session;
  open: boolean;
  wide: boolean;
  close: () => void;
  show: () => void;
};

export const MeetingDetails = ({
  meeting,
  session,
  open,
  wide,
  close,
  show,
}: MeetingDetailsProps) => {
  const editing = useDisclosure();
  const [visited, setVisited] = useState(false);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (editing.open) {
      setVisited(true);
    }
  }, [editing.open]);

  const content = (
    <DetailsContent
      meeting={meeting}
      session={session}
      close={close}
      edit={() => {
        close();
        editing.show();
      }}
    />
  );

  return (
    <>
      {wide && (
        <aside
          className={styles['details-sidebar']}
          data-testid="details-sidebar"
          aria-hidden={open || editing.open}
        >
          <h2>Детали встречи</h2>
          <DetailsContent
            meeting={meeting}
            session={session}
            close={close}
            edit={editing.show}
            compact
            showAll={show}
          />
        </aside>
      )}
      <Dialog open={open} title={meeting.title} onClose={close} chatAction>
        {open && content}
      </Dialog>
      <Dialog
        open={editing.open}
        title="Настройки встречи"
        onClose={() => editing.close()}
        chatAction
      >
        {(visited || editing.open) && (
          <EditMeetingForm
            key={generation}
            meeting={meeting}
            session={session}
            onSaved={() => {
              setVisited(false);
              setGeneration((value) => value + 1);
              editing.close();
            }}
          />
        )}
      </Dialog>
    </>
  );
};
