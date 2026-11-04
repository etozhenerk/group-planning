import { ChatDialogs } from "@preview/ChatDialogs";
import { useDesktopConversation } from "@desktop/pages/chat/model/useDesktopConversation";
import { ChatHeader } from "@desktop/pages/chat/ui/ChatHeader/ChatHeader";
import { FeedBody } from "@desktop/pages/chat/ui/FeedBody/FeedBody";
import { Composer } from "@desktop/pages/chat/ui/Composer/Composer";
import styles from "@desktop/pages/chat/ui/Conversation/Conversation.module.css";

export type ConversationProps = {
  onInfo: () => void;
  onShare: () => void;
  infoOpen: boolean;
};

export const Conversation = ({
  onInfo,
  onShare,
  infoOpen,
}: ConversationProps) => {
  const view = useDesktopConversation();
  return (
    <main className={styles.conversation} ref={view.surface.boundary} id="main">
      <ChatHeader onInfo={onInfo} onShare={onShare} infoOpen={infoOpen} />
      <div
        className={styles.feed}
        ref={view.feed}
        style={{ paddingBottom: view.unavailable ? 32 : view.dockHeight + 24 }}
        onScroll={view.onScroll}
      >
        <div className={styles.thread}>
          <FeedBody surface={view.surface} />
        </div>
      </div>
      {!view.unavailable && (
        <Composer
          surface={view.surface}
          dockRef={view.dock}
          showForm={view.setDialog}
          jump={view.jump}
        />
      )}
      <ChatDialogs kind={view.dialog} close={() => view.setDialog(null)} />
    </main>
  );
};
