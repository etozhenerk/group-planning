import { useEffect, useState } from "react";
import { useChatPreview } from "@preview/useChatPreview";
import { ChatContext } from "@preview/ChatContext";
import { Sidebar } from "@desktop/pages/chat/ui/Sidebar/Sidebar";
import { Conversation } from "@desktop/pages/chat/ui/Conversation/Conversation";
import { InfoPanel } from "@desktop/pages/chat/ui/InfoPanel/InfoPanel";
import { InfoDialog } from "@desktop/pages/chat/ui/InfoDialog/InfoDialog";
import { ShareDialog } from "@desktop/pages/chat/ui/ShareDialog/ShareDialog";
import { PreviewControls } from "@desktop/pages/chat/ui/PreviewControls/PreviewControls";
import styles from "@desktop/pages/chat/ui/DesktopChat/DesktopChat.module.css";

export const DesktopChat = () => {
  const model = useChatPreview();
  const [wide, setWide] = useState(
    () => matchMedia("(min-width:1101px)").matches,
  );
  const [info, setInfo] = useState(wide),
    [share, setShare] = useState(false);
  useEffect(() => {
    const media = matchMedia("(min-width:1101px)");
    const update = () => {
      setWide(media.matches);
      setInfo(media.matches);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <ChatContext.Provider value={model}>
      <div className={styles.page}>
        <div className={styles.workspace} data-info={wide && info}>
          <Sidebar />
          <Conversation
            onInfo={() => setInfo((value) => !value)}
            infoOpen={info}
            onShare={() => setShare(true)}
          />
          {wide && (
            <div
              className={styles.infoSlot}
              data-open={info}
              inert={!info}
              aria-hidden={!info}
            >
              <InfoPanel
                onClose={() => setInfo(false)}
                onShare={() => setShare(true)}
              />
            </div>
          )}
        </div>
        <InfoDialog
          open={!wide && info}
          onClose={() => setInfo(false)}
          onShare={() => {
            setInfo(false);
            setShare(true);
          }}
        />
        <ShareDialog open={share} onClose={() => setShare(false)} />
        <PreviewControls scenario={model.scenario} />
      </div>
    </ChatContext.Provider>
  );
};
