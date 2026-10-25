import styles from '@/widgets/meeting-details/ui/MeetingDetails/MeetingDetails.module.css';
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
      <Dialog open={open} title="Детали встречи" onClose={close}>
        {open && content}
      </Dialog>
      <Dialog
        open={editing.open}
        title="Настройки встречи"
        onClose={() => editing.close()}
      >
        {editing.open && (
          <EditMeetingForm
            meeting={meeting}
            session={session}
            onSaved={() => editing.close()}
          />
        )}
      </Dialog>
    </>
  );
};
