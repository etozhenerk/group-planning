import { ChevronLeft, X } from 'lucide-react';
import { ChatIcon } from '@/shared/ui/ChatIcon';

export type DialogDismissContentProps = { inline: boolean; chatAction: boolean };

export const DialogDismissContent = ({
  inline,
  chatAction,
}: DialogDismissContentProps) =>
  inline ? (
    <>
      <ChevronLeft aria-hidden="true" />
      Назад
    </>
  ) : chatAction ? (
    <ChatIcon name="close" />
  ) : (
    <X aria-hidden="true" />
  );
