import { type Context } from "@prototype/pages/chat/model/context";
import { type SheetName } from "@prototype/pages/chat/model/model";
import { find } from "@prototype/shared/lib/dom";
import { renderSheet } from "@prototype/pages/chat/ui/sheet-content";

export const installSheets = (context: Context): void => {
  const { state } = context;
  const overlay = find("#sheet-overlay");
  const sheet = find("#sheet");
  const chat = find("#chat-surface");

  context.redrawSheet = () => {
    const scroll = sheet.querySelector(".sheet-scroll")?.scrollTop ?? 0;
    sheet.innerHTML = renderSheet(state);
    const content = sheet.querySelector(".sheet-scroll");

    if (content) {
      content.scrollTop = scroll;
    }
  };

  const present = (
    name: SheetName | null,
    returnTo: SheetName | null = null,
  ): void => {
    state.sheet = name;
    state.sheetReturn = returnTo;
    state.calendar = null;
    overlay.hidden = !name;
    chat.inert = Boolean(name);

    if (name) {
      context.redrawSheet();
      sheet.focus({ preventScroll: true });
    } else {
      const fallback = state.sheetOpener?.dataset.action;
      const opener = state.sheetOpener?.isConnected
        ? state.sheetOpener
        : document.querySelector<HTMLElement>(`[data-action="${fallback}"]`);
      (opener ?? find("#emoji-button")).focus({ preventScroll: true });
    }
  };

  context.openSheet = (name, returnTo = null) => {
    if (name === "settings" && state.user !== "sasha") {
      context.toast("Настройки доступны организатору");

      return;
    }

    context.rememberSelection();
    context.setEmoji(false);
    context.closeReaction();

    if (!state.sheet) {
      state.sheetOpener = document.activeElement as HTMLElement;
    }

    if (name === "settings" && !state.settingsDraft) {
      state.settingsDraft = { ...state.meeting };
    }

    history.pushState({ prototypeSheet: name, returnTo }, "");
    present(name, returnTo);
  };

  context.closeSheet = () => {
    if (state.calendar) {
      state.calendar = null;
      context.redrawSheet();

      return;
    }

    if (history.state?.prototypeSheet) {
      history.back();
    } else {
      present(null);
    }
  };

  window.addEventListener("popstate", (event) => {
    present(event.state?.prototypeSheet ?? null, event.state?.returnTo ?? null);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();

      if (state.sheet) {
        context.closeSheet();
      } else if (state.reaction) {
        const id = state.reaction.messageId;
        context.closeReaction();
        document
          .querySelector<HTMLButtonElement>(
            `[data-bubble="${id}"]`,
          )
          ?.focus({ preventScroll: true });
      } else if (state.emojiOpen) {
        context.setEmoji(false);
        find("#emoji-button").focus({ preventScroll: true });
      } else if (state.menuOpen) {
        context.setMenu(false);
        find("#add-button").focus({ preventScroll: true });
      }
    }

    if (event.key === "Tab" && state.sheet) {
      const controls = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea, select, [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);

      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === sheet)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  let dragStart: number | null = null;
  let dragDelta = 0;

  sheet.addEventListener("pointerdown", (event) => {
    if (
      !(event.target as HTMLElement).closest("#sheet-grab-area") ||
      (event.target as HTMLElement).closest("button")
    ) {
      return;
    }

    dragStart = event.clientY;
    sheet.setPointerCapture(event.pointerId);
  });

  sheet.addEventListener("pointermove", (event) => {
    if (dragStart === null) {
      return;
    }

    dragDelta = Math.max(0, event.clientY - dragStart);
    sheet.style.transform = `translateY(${dragDelta}px)`;
  });

  const endDrag = (): void => {
    if (dragStart === null) {
      return;
    }

    dragStart = null;
    sheet.style.transform = "";

    if (dragDelta > 90) {
      context.closeSheet();
    }

    dragDelta = 0;
  };

  sheet.addEventListener("pointerup", endDrag);
  sheet.addEventListener("pointercancel", endDrag);
};

export const focusPeopleToggle = (expanded: boolean): void => {
  const selector = expanded
    ? '#sheet .people-list [data-action="toggle-people"]'
    : "#sheet .people-summary";
  const button = document.querySelector<HTMLButtonElement>(selector);
  const scroll = document.querySelector<HTMLElement>("#sheet .sheet-scroll");

  if (!button || !scroll) {
    return;
  }

  button.focus({ preventScroll: true });
  const buttonBounds = button.getBoundingClientRect();
  const scrollBounds = scroll.getBoundingClientRect();

  if (buttonBounds.bottom > scrollBounds.bottom) {
    scroll.scrollTop += buttonBounds.bottom - scrollBounds.bottom;
  } else if (buttonBounds.top < scrollBounds.top) {
    scroll.scrollTop += buttonBounds.top - scrollBounds.top;
  }
};
