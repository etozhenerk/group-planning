import type { RefObject } from 'react';
import { Dialog } from '@/shared/ui/Dialog';
import { ReadersList } from '@/widgets/conversation/ui/ReadersList';
import { useReadersReady } from '@/widgets/conversation/ui/ReadersDialog/hooks/useReadersReady';

export type ReadersDialogProps = {
  meeting: string;
  user: string;
  entry: string;
  version: string | undefined;
  open: boolean;
  close: () => void;
  anchor: RefObject<HTMLElement | null>;
};

export const ReadersDialog = ({
  meeting,
  user,
  entry,
  version,
  open,
  close,
  anchor,
}: ReadersDialogProps) => {
  const ready = useReadersReady(open);

  return (
    <Dialog
      open={ready}
      title="Прочитали"
      onClose={close}
      chatAction
      returnFocus={anchor}
    >
      <ReadersList
        meeting={meeting}
        user={user}
        entry={entry}
        version={version}
        enabled={ready}
        close={close}
      />
    </Dialog>
  );
};
