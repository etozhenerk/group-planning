import { useRef } from "react";
import { ChatIcon } from "@/shared/ui/ChatIcon";
import { ActionMenu } from "@/widgets/conversation/ui/ActionMenu";
import type { ConversationSurface } from "@/widgets/conversation/model/useConversationSurface";
import { useChatModel } from "@preview/ChatContext";
import styles from "@desktop/pages/chat/ui/AddAction/AddAction.module.css";

export type AddActionProps = {
  surface: ConversationSurface;
  showForm: (kind: string) => void;
};

export const AddAction = ({ surface, showForm }: AddActionProps) => {
  const model = useChatModel();
  const file = useRef<HTMLInputElement>(null),
    photo = useRef<HTMLInputElement>(null);
  const show = (kind: string) => {
    surface.setPanel(null);
    if (kind === "photo") photo.current?.click();
    else if (kind === "file") file.current?.click();
    else showForm(kind);
  };
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.add}
        aria-label="Добавить к встрече"
        aria-expanded={surface.panel === "add"}
        onClick={() => surface.setPanel(surface.panel === "add" ? null : "add")}
      >
        <ChatIcon name="plus" size={24} />
      </button>
      <ActionMenu open={surface.panel === "add"} select={show} />
      <input
        ref={photo}
        hidden
        type="file"
        accept="image/*"
        onChange={(event) => {
          const value = event.target.files?.[0];
          if (value) model.attach(value, true);
          event.target.value = "";
        }}
      />
      <input
        ref={file}
        hidden
        type="file"
        onChange={(event) => {
          const value = event.target.files?.[0];
          if (value) model.attach(value, false);
          event.target.value = "";
        }}
      />
    </div>
  );
};
