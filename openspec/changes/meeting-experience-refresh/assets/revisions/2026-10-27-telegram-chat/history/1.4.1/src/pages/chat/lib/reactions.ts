import { type Context } from "@prototype/pages/chat/model/context";
import { find } from "@prototype/shared/lib/dom";
import { reactionPicker } from "@prototype/pages/chat/ui/emoji-picker";

export const installReactions = (context: Context): void => {
  const { state } = context;
  const host = find("#reaction-host");
  const conversation = find("#conversation");
  let savedScroll: number | null = null;

  const position = (): void => {
    if (!state.reaction) {
      return;
    }

    const bubble = document.querySelector<HTMLElement>(
      `[data-bubble="${state.reaction.messageId}"]`,
    );

    if (!bubble) {
      return;
    }

    const rect = bubble.getBoundingClientRect();
    const bounds = conversation.getBoundingClientRect();
    host.style.setProperty(
      "--reaction-space",
      `${Math.max(160, bounds.height - Math.min(rect.height, 80) - 24)}px`,
    );
    const height = host.offsetHeight;
    const width = host.offsetWidth;
    const below = rect.bottom + 8;
    const above = rect.top - height - 8;
    const desiredTop = above >= bounds.top + 4 ? above : below;
    host.style.left = `${Math.max(bounds.left + 8, Math.min(rect.left, bounds.right - width - 8))}px`;
    host.style.top = `${Math.max(bounds.top + 4, Math.min(desiredTop, bounds.bottom - height - 8))}px`;
  };

  context.closeReaction = () => {
    state.reaction = null;
    host.hidden = true;
    document
      .querySelectorAll(".reaction-target")
      .forEach((element) => element.classList.remove("reaction-target"));
    find(".conversation-end").style.height = "";

    if (savedScroll !== null) {
      conversation.scrollTop = savedScroll;
      savedScroll = null;
    }
  };

  context.showReaction = (messageId, expanded = false) => {
    context.rememberSelection();
    context.setEmoji(false);

    if (savedScroll === null) {
      savedScroll = conversation.scrollTop;
    }

    state.reaction = { messageId, expanded, category: "recent", query: "" };
    host.innerHTML = reactionPicker(state);
    host.hidden = false;
    document
      .querySelectorAll(".reaction-target")
      .forEach((element) => element.classList.remove("reaction-target"));
    document
      .querySelector(`[data-bubble="${messageId}"]`)
      ?.classList.add("reaction-target");

    if (expanded) {
      find(".conversation-end").style.height = `${conversation.clientHeight}px`;
      const bubble = document.querySelector<HTMLElement>(
        `[data-bubble="${messageId}"]`,
      );

      if (bubble) {
        conversation.scrollTop +=
          bubble.getBoundingClientRect().top -
          conversation.getBoundingClientRect().top -
          8;
      }
    }

    position();
    host
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
  };

  window.addEventListener("resize", position);
  find("#conversation").addEventListener("scroll", position);

  let pressTimer: number | undefined;
  let startX = 0;
  let startY = 0;

  find("#message-list").addEventListener("pointerdown", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-bubble]",
    );

    if (!target || event.pointerType === "mouse") {
      return;
    }

    startX = event.clientX;
    startY = event.clientY;
    pressTimer = window.setTimeout(
      () => context.showReaction(target.dataset.bubble ?? "m3"),
      450,
    );
  });

  document.addEventListener("pointermove", (event) => {
    if (
      Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) >
      12
    ) {
      clearTimeout(pressTimer);
    }
  });

  for (const name of ["pointerup", "pointercancel"]) {
    document.addEventListener(name, () => clearTimeout(pressTimer));
  }
};

export const toggleReaction = (
  context: Context,
  messageId: string,
  emoji: string,
): void => {
  const { state } = context;
  const message = state.messages.find((item) => item.id === messageId);

  if (!message) {
    return;
  }

  const users = message.reactions[emoji] ?? [];
  const removing = users.includes(state.user);
  message.reactions[emoji] = removing
    ? users.filter((id) => id !== state.user)
    : [...users, state.user];
  state.recent = [
    emoji,
    ...state.recent.filter((value) => value !== emoji),
  ].slice(0, 24);
  context.closeReaction();
  context.redrawConversation();
  context.announce(
    removing ? `Реакция ${emoji} снята` : `Реакция ${emoji} добавлена`,
  );
  document
    .querySelector<HTMLButtonElement>(
      `[data-action="reaction-open"][data-message-id="${messageId}"]`,
    )
    ?.focus({ preventScroll: true });
};

export const setReactorFilter = (context: Context, filter: string): void => {
  context.state.reactorFilter = filter;
  context.redrawSheet();
  document
    .querySelector<HTMLButtonElement>(
      `#sheet [data-action="reactor-filter"][data-filter="${filter}"]`,
    )
    ?.focus({ preventScroll: true });
};
