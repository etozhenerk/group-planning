import {
  type PrototypeState,
  type SheetName,
} from "@prototype/pages/chat/model/model";

export type Context = {
  state: PrototypeState;
  redrawConversation: (bottom?: boolean) => void;
  redrawInfo: () => void;
  redrawSheet: () => void;
  openSheet: (name: SheetName, returnTo?: SheetName | null) => void;
  closeSheet: () => void;
  setEmoji: (open: boolean, keyboard?: boolean) => void;
  showReaction: (messageId: string, expanded?: boolean) => void;
  closeReaction: () => void;
  updateDraft: () => void;
  rememberSelection: () => void;
  announce: (message: string) => void;
  toast: (message: string) => void;
};
