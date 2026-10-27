import { type Context } from "@prototype/pages/chat/model/context";
import {
  createState,
  type PersonId,
  type SheetName,
} from "@prototype/pages/chat/model/model";
import { installActions } from "@prototype/pages/chat/lib/actions";
import { installComposer } from "@prototype/pages/chat/lib/composer";
import { installFormEvents } from "@prototype/pages/chat/lib/form-events";
import { installReactions } from "@prototype/pages/chat/lib/reactions";
import { installSheets } from "@prototype/pages/chat/lib/sheets";
import { dateLabel, find } from "@prototype/shared/lib/dom";
import {
  renderMessages,
  renderShell,
} from "@prototype/pages/chat/ui/conversation";

export const startChat = (): void => {
  const state = createState();
  find("#app").innerHTML = renderShell(state);
  let toastTimer: number | undefined;
  const noop = (): void => {};

  const context: Context = {
    state,
    redrawConversation: (bottom = false) => {
      const conversation = find("#conversation");
      const scroll = conversation.scrollTop;
      find("#message-list").innerHTML = renderMessages(state);
      conversation.scrollTop = bottom ? conversation.scrollHeight : scroll;
    },
    redrawInfo: () => {
      find("#meeting-name").textContent = state.meeting.title;
      find(".header-subtitle").textContent =
        `${dateLabel(state.meeting.date, true)} · 4 участника`;
    },
    redrawSheet: noop,
    openSheet: noop,
    closeSheet: noop,
    setEmoji: noop,
    showReaction: noop,
    closeReaction: noop,
    updateDraft: noop,
    rememberSelection: noop,
    announce: (message) => {
      find("#announcement").textContent = message;
    },
    toast: (message) => {
      clearTimeout(toastTimer);
      find("#toast").textContent = message;
      find("#toast").hidden = false;
      toastTimer = window.setTimeout(() => {
        find("#toast").hidden = true;
      }, 2800);
    },
  };

  installComposer(context);
  installReactions(context);
  installSheets(context);
  installFormEvents(context);
  installActions(context);
  context.redrawInfo();

  const applyScenario = (scenario: string): void => {
    state.sheet = null;
    state.sheetReturn = null;
    state.calendar = null;
    find("#sheet-overlay").hidden = true;
    find("#chat-surface").inert = false;
    history.replaceState(null, "");
    context.closeReaction();
    context.setEmoji(false);

    if (scenario === "emoji") {
      context.setEmoji(true);
    } else if (scenario === "quick" || scenario === "reactions") {
      document
        .querySelector('[data-message="m3"]')
        ?.scrollIntoView({ block: "center" });
      context.showReaction("m3", scenario === "reactions");
    } else if (
      [
        "info",
        "share",
        "settings",
        "task",
        "date",
        "place",
        "new-task",
        "reactors",
      ].includes(scenario)
    ) {
      context.openSheet(scenario as SheetName);
    }
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.origin !== location.origin) {
      return;
    }

    const data = event.data as {
      kind?: string;
      scenario?: string;
      role?: PersonId;
      task?: string;
      active?: boolean;
    };

    if (data.kind === "scenario") {
      applyScenario(data.scenario ?? "chat");
    }

    if (
      data.kind === "role" &&
      ["sasha", "lena", "tim"].includes(data.role ?? "")
    ) {
      state.user = data.role!;
      context.redrawConversation();
      context.redrawInfo();

      if (state.sheet) {
        context.redrawSheet();
      }
    }

    if (data.kind === "task") {
      state.task = {
        title: "Заказать пиццу",
        author: "lena",
        recipient: data.task === "other" ? "tim" : "sasha",
        assignee:
          data.task === "accepted" || data.task === "done" ? "sasha" : null,
        status:
          data.task === "accepted"
            ? "accepted"
            : data.task === "done"
              ? "done"
              : "proposed",
      };
      context.redrawConversation();

      if (state.sheet) {
        context.redrawSheet();
      }
    }

    if (data.kind === "place-poll") {
      state.activePlacePoll = Boolean(data.active);

      if (state.sheet === "place") {
        context.redrawSheet();
      }
    }
  });

  const updateViewport = (): void => {
    document.documentElement.style.setProperty(
      "--visible-height",
      `${window.visualViewport?.height ?? window.innerHeight}px`,
    );
  };

  window.visualViewport?.addEventListener("resize", updateViewport);
  updateViewport();
  requestAnimationFrame(() => {
    find("#conversation").scrollTop = find("#conversation").scrollHeight;
    applyScenario(new URLSearchParams(location.search).get("view") ?? "chat");
  });
};
