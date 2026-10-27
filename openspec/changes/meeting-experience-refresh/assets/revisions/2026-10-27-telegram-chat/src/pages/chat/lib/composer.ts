import { type Context } from "@prototype/pages/chat/model/context";
import { find, icon } from "@prototype/shared/lib/dom";
import { emojiPicker } from "@prototype/pages/chat/ui/emoji-picker";
import { installDockMotion } from "@prototype/pages/chat/lib/dock-motion";

export const installComposer = (context: Context): void => {
  const { state } = context;
  const input = find<HTMLTextAreaElement>("#message-input");
  const conversation = find("#conversation");
  const button = find("#emoji-button");
  const dock = find("#emoji-dock");
  let preserveScroll = () => {};
  const moveDock = installDockMotion(dock, () => preserveScroll());

  context.rememberSelection = () => {
    state.selection = { start: input.selectionStart, end: input.selectionEnd };
    state.draft = input.value;
  };

  context.updateDraft = () => {
    input.value = state.draft;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 108)}px`;
    find<HTMLButtonElement>("#send-button").disabled = !state.draft.trim();
  };

  context.setEmoji = (open, keyboard = false) => {
    if (open) {
      context.closeReaction();
    }

    const scroll = conversation.scrollTop;
    const atBottom =
      conversation.scrollHeight - conversation.clientHeight - scroll < 24;
    const unchanged = state.emojiOpen === open;
    state.emojiOpen = open;
    context.setMenu(false);

    if (unchanged) {
      return;
    }

    if (open) {
      context.rememberSelection();
      input.blur();
      dock.innerHTML = emojiPicker(state);
    }

    preserveScroll = () => {
      conversation.scrollTop = atBottom ? conversation.scrollHeight : scroll;
    };
    dock.inert = !open;
    dock.setAttribute("aria-hidden", String(!open));
    moveDock(open);
    button.innerHTML = icon(open ? "keyboard" : "smile");
    button.setAttribute(
      "aria-label",
      open ? "Вернуться к клавиатуре" : "Выбрать эмодзи",
    );
    button.setAttribute("aria-expanded", String(open));
    requestAnimationFrame(() => {
      conversation.scrollTop = atBottom ? conversation.scrollHeight : scroll;

      if (!open && keyboard) {
        input.focus({ preventScroll: true });
        input.setSelectionRange(state.selection.start, state.selection.end);
      }
    });
  };

  input.addEventListener("input", () => {
    context.rememberSelection();
    context.updateDraft();
  });

  for (const name of ["select", "keyup", "click", "blur"]) {
    input.addEventListener(name, context.rememberSelection);
  }

  input.addEventListener("pointerdown", () => {
    if (state.emojiOpen) {
      context.setEmoji(false);
    }
  });

  find("#composer").addEventListener("submit", (event) => {
    event.preventDefault();

    if (!input.value.trim()) {
      return;
    }

    state.messages.push({
      id: `m${Date.now()}`,
      author: state.user,
      text: input.value.trim(),
      time: "12:40",
      reactions: {},
    });
    state.draft = "";
    state.selection = { start: 0, end: 0 };
    context.updateDraft();
    context.redrawConversation(true);
    context.announce("Сообщение добавлено в макет чата");
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      find<HTMLFormElement>("#composer").requestSubmit();
    }
  });

  context.updateDraft();
  input.setSelectionRange(state.selection.start, state.selection.end);
};

export const insertEmoji = (context: Context, emoji: string): void => {
  const { state } = context;
  const { start, end } = state.selection;
  state.draft = state.draft.slice(0, start) + emoji + state.draft.slice(end);
  state.selection = { start: start + emoji.length, end: start + emoji.length };
  state.recent = [
    emoji,
    ...state.recent.filter((value) => value !== emoji),
  ].slice(0, 24);
  context.updateDraft();
  find<HTMLTextAreaElement>("#message-input").setSelectionRange(
    state.selection.start,
    state.selection.end,
  );
  context.announce(`Эмодзи ${emoji} вставлен в сообщение`);
};

export const removePreviousGrapheme = (context: Context): void => {
  const { state } = context;
  let { start, end } = state.selection;

  if (start === end && start > 0) {
    const segments = Array.from(
      new Intl.Segmenter("ru", { granularity: "grapheme" }).segment(
        state.draft.slice(0, start),
      ),
    );
    start = segments.at(-1)?.index ?? start - 1;
  }

  state.draft = state.draft.slice(0, start) + state.draft.slice(end);
  state.selection = { start, end: start };
  context.updateDraft();
  find<HTMLTextAreaElement>("#message-input").setSelectionRange(start, start);
};
