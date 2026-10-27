import { addMenu } from "@prototype/pages/chat/ui/add-menu";
import { type Context } from "@prototype/pages/chat/model/context";
import { type SheetName } from "@prototype/pages/chat/model/model";
import {
  insertEmoji,
  removePreviousGrapheme,
} from "@prototype/pages/chat/lib/composer";
import { handleCalendar } from "@prototype/pages/chat/lib/form-events";
import {
  setReactorFilter,
  toggleReaction,
} from "@prototype/pages/chat/lib/reactions";
import { handleTaskAction } from "@prototype/pages/chat/lib/task-actions";
import { focusPeopleToggle } from "@prototype/pages/chat/lib/sheets";
import { find } from "@prototype/shared/lib/dom";
import {
  emojiPicker,
  emojiResults,
} from "@prototype/pages/chat/ui/emoji-picker";

export const installActions = (context: Context): void => {
  const { state } = context;
  const panelActions: Record<string, SheetName> = {
    "open-info": "info",
    "open-share": "share",
    "open-task": "task",
    "open-date": "date",
    "open-place": "place",
    "open-new-task": "new-task",
    "open-rsvp": "rsvp",
    "open-photo": "attachment",
    "open-file": "attachment",
  };

  document.addEventListener("pointerdown", (event) => {
    const target = event.target as HTMLElement;

    if (
      target.closest(
        "#emoji-button, #add-button, [data-action='insert-emoji'], [data-action='emoji-backspace']",
      )
    ) {
      event.preventDefault();
    }

    if (
      state.reaction &&
      !target.closest("#reaction-host, [data-action='reaction-open']")
    ) {
      context.closeReaction();
    }

    if (state.menuOpen && !target.closest("#add-menu, #add-button")) {
      state.menuOpen = false;
      find("#add-menu").hidden = true;
      find("#add-button").setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-action]",
    );
    const action = target?.dataset.action;

    if (!target || !action || target.hasAttribute("disabled")) {
      return;
    }

    if (panelActions[action]) {
      context.openSheet(panelActions[action]);

      return;
    }

    if (
      handleCalendar(context, action, target) ||
      handleTaskAction(context, action)
    ) {
      return;
    }

    switch (action) {
      case "toggle-emoji":
        context.setEmoji(!state.emojiOpen, state.emojiOpen);
        break;
      case "insert-emoji":
        insertEmoji(context, target.dataset.emoji ?? "");
        break;
      case "emoji-backspace":
        removePreviousGrapheme(context);
        break;
      case "emoji-category": {
        const reaction = target.dataset.mode === "reaction";

        if (reaction && state.reaction) {
          state.reaction.category = target.dataset.category ?? "recent";
          state.reaction.query = "";
          const picker = find(".reaction-picker");
          const contextNode =
            picker.querySelector(".reaction-context")?.outerHTML ?? "";
          picker.innerHTML = contextNode + emojiPicker(state, true);
        } else {
          state.emojiCategory = target.dataset.category ?? "recent";
          state.emojiQuery = "";
          find("#emoji-dock").innerHTML = emojiPicker(state);
        }

        document
          .querySelector<HTMLElement>(
            `[data-mode="${reaction ? "reaction" : "composer"}"][data-category="${target.dataset.category}"]`,
          )
          ?.focus({ preventScroll: true });
        break;
      }
      case "clear-emoji-search": {
        const mode = target.dataset.mode ?? "composer";
        const input = document.querySelector<HTMLInputElement>(
          `[data-emoji-search="${mode}"]`,
        )!;
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus({ preventScroll: true });
        break;
      }
      case "toggle-menu": {
        const next = !state.menuOpen;
        context.setEmoji(false);
        context.closeReaction();
        state.menuOpen = next;
        find("#add-menu").hidden = !next;
        find("#add-button").setAttribute("aria-expanded", String(next));
        break;
      }
      case "reaction-open":
        context.showReaction(target.dataset.messageId ?? "m3");
        break;
      case "expand-reaction":
        context.showReaction(state.reaction?.messageId ?? "m3", true);
        break;
      case "close-reaction": {
        const messageId = state.reaction?.messageId;
        context.closeReaction();
        document
          .querySelector<HTMLButtonElement>(
            `[data-action="reaction-open"][data-message-id="${messageId}"]`,
          )
          ?.focus({ preventScroll: true });
        break;
      }
      case "pick-reaction":
        toggleReaction(
          context,
          state.reaction?.messageId ?? "m3",
          target.dataset.emoji ?? "❤️",
        );
        break;
      case "toggle-reaction":
        toggleReaction(
          context,
          target.dataset.messageId ?? "m3",
          target.dataset.emoji ?? "❤️",
        );
        break;
      case "reactors":
        state.reactorMessage = target.dataset.messageId ?? "m3";
        state.reactorFilter = "all";
        context.openSheet("reactors");
        break;
      case "reactor-filter":
        setReactorFilter(context, target.dataset.filter ?? "all");
        break;
      case "close-sheet":
        context.closeSheet();
        break;
      case "info-share":
        context.openSheet("share", state.sheet === "info" ? "info" : null);
        break;
      case "open-settings":
        context.openSheet("settings", state.sheet === "info" ? "info" : null);
        break;
      case "toggle-people":
        state.peopleExpanded = !state.peopleExpanded;
        context.redrawInfo();
        if (state.sheet) {
          context.redrawSheet();
          focusPeopleToggle(state.peopleExpanded);
        }
        break;
      case "toggle-cover":
        if (state.settingsDraft) {
          state.settingsDraft.cover = !state.settingsDraft.cover;
          context.redrawSheet();
        }
        break;
      case "copy-link":
        void navigator.clipboard
          .writeText("https://somewhere.test/invite/demo")
          .then(
            () => context.toast("Демонстрационная ссылка скопирована"),
            () => context.toast("Выделите ссылку и скопируйте её"),
          );
        break;
      case "vote-for":
        state.vote = "for";
        context.redrawConversation();
        context.announce("Голос за место учтён в макете");
        break;
      case "vote-against":
        state.vote = "against";
        context.redrawConversation();
        context.announce("Голос против учтён в макете");
        break;
      case "add-date":
        state.dateDraft.dates.push("2026-11-08");
        context.redrawSheet();
        break;
      case "remove-date":
        if (state.dateDraft.dates.length > 2) {
          state.dateDraft.dates.splice(Number(target.dataset.index), 1);
          context.redrawSheet();
        }
        break;
    }
  });

  document.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    const mode = input.dataset.emojiSearch;

    if (!mode) {
      return;
    }

    if (mode === "reaction" && state.reaction) {
      state.reaction.query = input.value;
    } else {
      state.emojiQuery = input.value;
    }

    find(`[data-emoji-results="${mode}"]`).innerHTML = emojiResults(
      state,
      mode === "reaction",
    );
  });

  find("#add-menu").innerHTML = addMenu();
};
