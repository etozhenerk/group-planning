import type { Session } from '@/entities/session';
import { useMobileLayout, useMediaQuery } from '@/shared/lib/media';
import { designTokens } from '@/shared/config/design-tokens';
import { useSendMessage } from '@/features/send-message/model/useSendMessage';
import { useEmojiPanel } from '@/features/send-message/ui/SendMessage/hooks/useEmojiPanel';
import { useEmojiInsertion } from '@/features/send-message/ui/SendMessage/hooks/useEmojiInsertion';
import { useEmojiPresence } from '@/features/send-message/ui/SendMessage/hooks/useEmojiPresence';

export const useComposer = (
  id: string,
  session: Session,
  open: boolean,
  toggle?: () => void,
) => {
  const mobile = useMobileLayout();
  const compact = useMediaQuery(
    `(height <= ${designTokens.breakpointChatCompactHeight})`,
  );

  const action = useSendMessage(id, session);
  const emoji = useEmojiInsertion(
    action.text,
    action.setText,
    action.selection,
    action.rememberSelection,
  );

  const panel = useEmojiPanel(open, toggle, !mobile);
  const presence = useEmojiPresence(open, mobile, compact);
  const togglePanel = () => {
    if (open) {
      toggle?.();
      emoji.restore();
    } else {
      if (document.activeElement === emoji.input.current) {
        emoji.remember();
      }

      emoji.input.current?.blur();
      toggle?.();
    }
  };

  return { mobile, compact, action, emoji, panel, presence, togglePanel };
};
