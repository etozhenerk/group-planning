// Generated from revision.ts and extended.ts by generate.ts.
"use strict";
const extendedInitialSearch = location.search;
// Только навигация статичного макета. Сетевых операций и имитации API здесь нет.
const setupRevision = () => {
    const dialog = document.querySelector(".revision-sheet");
    const menu = document.querySelector("[data-revision-menu]");
    const workspace = document.querySelector(".workspace");
    const mobile = matchMedia("(max-width: 739px)");
    const views = [...document.querySelectorAll("[data-view]")];
    if (!dialog || !menu || !workspace) {
        return;
    }
    const files = new Map(views.map((view) => [view.dataset.view, view.dataset.file]));
    const kinds = new Map(views.map((view) => [view.dataset.file, view.dataset.view]));
    const origin = location.href;
    const initial = document.body.dataset.initial ?? "";
    let previous = null;
    let chain = [];
    let modal = false;
    const updateViewport = () => {
        const viewport = window.visualViewport;
        const height = viewport?.height ?? window.innerHeight;
        const bottom = Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0));
        dialog.style.setProperty("--revision-viewport-height", `${height}px`);
        dialog.style.setProperty("--revision-viewport-bottom", `${bottom}px`);
    };
    const paint = () => {
        const active = chain.at(-1) ?? "";
        const view = views.find((item) => item.dataset.view === active);
        const wasOpen = dialog.open;
        if (dialog.open && (modal !== mobile.matches || !view)) {
            dialog.close();
        }
        views.forEach((item) => {
            item.hidden = item !== view;
        });
        menu.hidden = active !== "menu";
        document.body.classList.toggle("revision-action-open", !!view);
        workspace.querySelector(".chat-header")?.toggleAttribute("inert", !!view);
        workspace.querySelector(".chat-layout")?.toggleAttribute("inert", !!view);
        document
            .querySelector(".sidebar")
            ?.toggleAttribute("inert", !!view && mobile.matches);
        if (view) {
            dialog.setAttribute("aria-labelledby", `title-${active}`);
            modal = mobile.matches;
            if (!dialog.open) {
                if (modal) {
                    dialog.showModal();
                }
                else {
                    dialog.show();
                }
            }
            view
                .querySelector(mobile.matches ? ".revision-close" : ".revision-back, a, input")
                ?.focus({ preventScroll: true });
        }
        else if (wasOpen) {
            previous?.focus({ preventScroll: true });
        }
        document.documentElement.style.overflow =
            view && mobile.matches ? "hidden" : "";
        document.body.dataset.revisionReady = "true";
        updateViewport();
    };
    const pathFor = (next) => {
        const active = next.at(-1) ?? "";
        return new URL(active === "menu" ? "chat-menu.html" : (files.get(active) ?? "chat.html"), origin);
    };
    const navigate = (next, replace = false) => {
        chain = next;
        const state = { chatSheetRevision: true, chain };
        if (replace) {
            history.replaceState(state, "", pathFor(next));
        }
        else {
            history.pushState(state, "", pathFor(next));
        }
        paint();
    };
    const close = () => {
        if (chain.length) {
            history.back();
        }
    };
    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }
        const closeButton = event.target.closest("[data-close]");
        if (closeButton) {
            event.preventDefault();
            close();
            return;
        }
        const link = event.target.closest("a[href]");
        if (!link ||
            event.metaKey ||
            event.ctrlKey ||
            event.altKey ||
            event.shiftKey) {
            return;
        }
        const url = new URL(link.href);
        const file = url.pathname.split("/").at(-1);
        const sameDirectory = new URL(".", link.href).href === new URL(".", origin).href;
        if (!sameDirectory) {
            return;
        }
        if (file === "chat.html") {
            event.preventDefault();
            if (chain.length) {
                history.go(-chain.length);
            }
            return;
        }
        const next = file === "chat-menu.html" ? "menu" : kinds.get(file);
        if (!next) {
            return;
        }
        event.preventDefault();
        if (next === "menu" && chain.at(-1) === "menu") {
            close();
            return;
        }
        if (!chain.length) {
            previous = link;
        }
        const active = chain.at(-1);
        const replacing = active === "menu" || (active && active !== "info");
        navigate(replacing ? [...chain.slice(0, -1), next] : [...chain, next], !!replacing);
    });
    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        close();
    });
    dialog.addEventListener("click", (event) => {
        if (mobile.matches && event.target === dialog) {
            const bounds = dialog.getBoundingClientRect();
            if (event.clientY < bounds.top ||
                event.clientX < bounds.left ||
                event.clientX > bounds.right) {
                close();
            }
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !dialog.matches(":modal") && chain.length) {
            event.preventDefault();
            close();
        }
    });
    window.addEventListener("popstate", (event) => {
        const saved = event.state;
        chain =
            saved?.chatSheetRevision && Array.isArray(saved.chain) ? saved.chain : [];
        paint();
    });
    mobile.addEventListener("change", paint);
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);
    const saved = history.state;
    if (saved?.chatSheetRevision && Array.isArray(saved.chain)) {
        chain = saved.chain;
        paint();
    }
    else {
        navigate([], true);
        if (initial) {
            navigate([initial]);
        }
    }
};
setupRevision();
// Только локальные переходы черновика. Не имитирует сохранение API или загрузку.
const setupExtendedDraft = () => {
    const datePanel = document.querySelector(".extended-date");
    const dateBody = datePanel?.querySelector(".sheet-content");
    const dateFooter = datePanel?.querySelector(".sheet-footer");
    const syncDates = () => {
        const rows = [
            ...(dateBody?.querySelectorAll("[data-date-row]") ?? []),
        ];
        rows.forEach((row, index) => {
            row
                .querySelector("input")
                ?.setAttribute("aria-label", `Вариант ${index + 1}`);
            const remove = row.querySelector("[data-remove-date]");
            if (remove) {
                remove.hidden = rows.length <= 2;
                remove.setAttribute("aria-label", `Удалить вариант ${index + 1}`);
            }
        });
    };
    const syncScroll = () => {
        if (dateBody && dateFooter) {
            dateFooter.dataset.more = String(dateBody.scrollHeight > dateBody.clientHeight + dateBody.scrollTop + 1);
        }
    };
    const clearErrors = () => {
        datePanel
            ?.querySelectorAll("[data-date-error]")
            .forEach((item) => item.remove());
        datePanel
            ?.querySelectorAll("[data-date-option]")
            .forEach((input) => {
            input.removeAttribute("aria-invalid");
            input.removeAttribute("aria-describedby");
            input
                .closest("[data-date-row]")
                ?.removeAttribute("data-invalid");
        });
    };
    const validateDates = () => {
        clearErrors();
        const inputs = [
            ...(datePanel?.querySelectorAll("[data-date-option]") ??
                []),
        ];
        const seen = new Set();
        let first;
        inputs.forEach((input, index) => {
            const text = !input.value
                ? "Выберите дату"
                : seen.has(input.value)
                    ? "Такая дата уже есть"
                    : "";
            seen.add(input.value);
            if (text) {
                first ??= input;
                const row = input.closest("[data-date-row]");
                const error = document.createElement("p");
                error.className = "caption extended-date-error";
                error.dataset.dateError = "true";
                error.id = `extended-date-error-${index}`;
                error.textContent = text;
                row?.after(error);
                row?.setAttribute("data-invalid", "true");
                input.setAttribute("aria-invalid", "true");
                input.setAttribute("aria-describedby", error.id);
            }
        });
        first?.focus();
        syncScroll();
        return !first;
    };
    dateBody?.addEventListener("scroll", syncScroll);
    if (dateBody)
        new ResizeObserver(syncScroll).observe(dateBody);
    syncDates();
    syncScroll();
    // Capture до навигации: невалидная форма не закрывается по ссылке CTA.
    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element) ||
            !event.target.closest("[data-submit-date]"))
            return;
        if (!validateDates()) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element))
            return;
        const nextTask = event.target.closest("[data-task-next]");
        if (nextTask?.dataset.taskNext) {
            const link = document.createElement("a");
            link.href = `${nextTask.dataset.taskNext}.html`;
            document.body.append(link);
            link.click();
            link.remove();
            return;
        }
        const addDate = event.target.closest("[data-add-date]");
        if (addDate) {
            event.preventDefault();
            const content = addDate.closest(".sheet-content");
            const dates = content?.querySelectorAll("[data-date-row]");
            const row = dates?.[0]?.cloneNode(true);
            const input = row?.querySelector("input");
            if (row && input && dates) {
                input.value = "";
                input.setAttribute("aria-label", `Вариант ${dates.length + 1}`);
                input.removeAttribute("aria-invalid");
                input.removeAttribute("aria-describedby");
                row.removeAttribute("data-invalid");
                addDate.before(row);
                clearErrors();
                syncDates();
                syncScroll();
                input.focus();
            }
            return;
        }
        const removeDate = event.target.closest("[data-remove-date]");
        if (removeDate &&
            (dateBody?.querySelectorAll("[data-date-row]").length ?? 0) > 2) {
            removeDate.closest("[data-date-row]")?.remove();
            clearErrors();
            syncDates();
            syncScroll();
            dateBody?.querySelector("[data-date-option]")?.focus();
            return;
        }
        const removeCover = event.target.closest("[data-remove-cover]");
        if (removeCover) {
            const preview = removeCover.closest(".upload-grid");
            preview?.setAttribute("hidden", "");
            document.querySelector("[data-cover-choice]")?.focus();
            return;
        }
        const chooseCover = event.target.closest("[data-cover-choice]");
        if (chooseCover) {
            // Восстанавливает только тот же демонстрационный снимок; системного picker нет.
            document
                .querySelector("[data-settings-form] .upload-grid")
                ?.removeAttribute("hidden");
        }
    });
    const sample = new URLSearchParams(extendedInitialSearch).get("sample");
    const inputs = datePanel?.querySelectorAll("[data-date-option]");
    if (sample === "missing" && inputs?.[0]) {
        inputs[0].value = "";
        validateDates();
    }
    else if (sample === "duplicate" && inputs?.[0] && inputs[1]) {
        inputs[1].value = inputs[0].value;
        validateDates();
    }
    else if (sample === "network") {
        datePanel
            ?.querySelector("[data-date-send-error]")
            ?.removeAttribute("hidden");
        const submit = datePanel?.querySelector("[data-submit-date]");
        if (submit)
            submit.textContent = "Повторить";
    }
    else if (sample === "long") {
        document.querySelectorAll(".extended-task h3").forEach((title) => {
            title.textContent =
                "Заказать пиццу для всей компании, уточнить у каждого ограничения по еде и договориться о доставке к началу встречи";
        });
    }
};
setupExtendedDraft();
