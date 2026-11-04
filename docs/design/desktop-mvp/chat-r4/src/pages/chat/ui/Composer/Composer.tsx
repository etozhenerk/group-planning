import type { RefObject } from "react";
import { SendMessage } from "@/features/send-message/ui/SendMessage";
import type { ConversationSurface } from "@/widgets/conversation/model/useConversationSurface";
import { useChatModel } from "@preview/ChatContext";
import { meeting, user } from "@preview/data";
import { AddAction } from "@desktop/pages/chat/ui/AddAction/AddAction";
import styles from "@desktop/pages/chat/ui/Composer/Composer.module.css";

export type ComposerProps = {
  surface: ConversationSurface;
  dockRef: RefObject<HTMLDivElement | null>;
  showForm: (kind: string) => void;
  jump: () => void;
};

export const Composer = ({
  surface,
  dockRef,
  showForm,
  jump,
}: ComposerProps) => {
  const model = useChatModel();
  return (
    <div className={styles.dock} ref={dockRef} data-testid="chat-dock">
      <div className={styles.compose}>
        {model.incoming > 0 && (
          <button className={styles.jump} type="button" onClick={jump}>
            К новым сообщениям ↓
          </button>
        )}
        <SendMessage
          id={meeting.id}
          session={user}
          emojiOpen={surface.panel === "emoji"}
          toggleEmoji={() =>
            surface.setPanel(surface.panel === "emoji" ? null : "emoji")
          }
          extraAction={<AddAction surface={surface} showForm={showForm} />}
        />
      </div>
    </div>
  );
};
