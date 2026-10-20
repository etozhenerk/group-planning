import { useDisclosure } from '@/shared/lib/disclosure';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { EditMeetingForm } from '@/features/edit-meeting';
import { Dialog } from '@/shared/ui/dialog';
import { DetailsContent } from '@/widgets/meeting-details/ui/DetailsContent';

export type MeetingDetailsProps = {
  meeting: Meeting;
  session: Session;
  open: boolean;
  close: () => void;
};

export const MeetingDetails = ({
  meeting,
  session,
  open,
  close,
}: MeetingDetailsProps) => {
  const editing = useDisclosure();

  return (
    <>
      <aside className="details-sidebar">
        <h2>Детали встречи</h2>
        <DetailsContent
          meeting={meeting}
          session={session}
          close={close}
          edit={() => editing.show()}
        />
      </aside>
      <Dialog open={open} title="Детали встречи" onClose={close}>
        <DetailsContent
          meeting={meeting}
          session={session}
          close={close}
          edit={() => {
            close();
            editing.show();
          }}
        />
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
