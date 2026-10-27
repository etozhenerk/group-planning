// Только локальные переходы черновика. Не имитирует сохранение API или загрузку.
const setupExtendedDraft = () => {
  const datePanel = document.querySelector<HTMLElement>(".extended-date");
  const dateBody = datePanel?.querySelector<HTMLElement>(".sheet-content");
  const dateFooter = datePanel?.querySelector<HTMLElement>(".sheet-footer");
  const syncDates = () => {
    const rows = [
      ...(dateBody?.querySelectorAll<HTMLElement>("[data-date-row]") ?? []),
    ];
    rows.forEach((row, index) => {
      row
        .querySelector("input")
        ?.setAttribute("aria-label", `Вариант ${index + 1}`);
      const remove = row.querySelector<HTMLButtonElement>("[data-remove-date]");

      if (remove) {
        remove.hidden = rows.length <= 2;
        remove.setAttribute("aria-label", `Удалить вариант ${index + 1}`);
      }
    });
  };
  const syncScroll = () => {
    if (dateBody && dateFooter) {
      dateFooter.dataset.more = String(
        dateBody.scrollHeight > dateBody.clientHeight + dateBody.scrollTop + 1,
      );
    }
  };
  const clearErrors = () => {
    datePanel
      ?.querySelectorAll("[data-date-error]")
      .forEach((item) => item.remove());
    datePanel
      ?.querySelectorAll<HTMLInputElement>("[data-date-option]")
      .forEach((input) => {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
        input
          .closest<HTMLElement>("[data-date-row]")
          ?.removeAttribute("data-invalid");
      });
  };
  const validateDates = () => {
    clearErrors();
    const inputs = [
      ...(datePanel?.querySelectorAll<HTMLInputElement>("[data-date-option]") ??
        []),
    ];
    const seen = new Set<string>();
    let first: HTMLInputElement | undefined;
    inputs.forEach((input, index) => {
      const text = !input.value
        ? "Выберите дату"
        : seen.has(input.value)
          ? "Такая дата уже есть"
          : "";
      seen.add(input.value);

      if (text) {
        first ??= input;
        const row = input.closest<HTMLElement>("[data-date-row]");
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
  if (dateBody) new ResizeObserver(syncScroll).observe(dateBody);
  syncDates();
  syncScroll();

  // Capture до навигации: невалидная форма не закрывается по ссылке CTA.
  document.addEventListener(
    "click",
    (event) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest("[data-submit-date]")
      )
        return;

      if (!validateDates()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const nextTask = event.target.closest<HTMLElement>("[data-task-next]");

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
      const dates = content?.querySelectorAll<HTMLElement>("[data-date-row]");
      const row = dates?.[0]?.cloneNode(true) as HTMLElement | undefined;
      const input = row?.querySelector<HTMLInputElement>("input");

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

    if (
      removeDate &&
      (dateBody?.querySelectorAll("[data-date-row]").length ?? 0) > 2
    ) {
      removeDate.closest("[data-date-row]")?.remove();
      clearErrors();
      syncDates();
      syncScroll();
      dateBody?.querySelector<HTMLInputElement>("[data-date-option]")?.focus();

      return;
    }

    const removeCover = event.target.closest("[data-remove-cover]");

    if (removeCover) {
      const preview = removeCover.closest(".upload-grid");
      preview?.setAttribute("hidden", "");
      document.querySelector<HTMLButtonElement>("[data-cover-choice]")?.focus();

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
  const inputs =
    datePanel?.querySelectorAll<HTMLInputElement>("[data-date-option]");

  if (sample === "missing" && inputs?.[0]) {
    inputs[0].value = "";
    validateDates();
  } else if (sample === "duplicate" && inputs?.[0] && inputs[1]) {
    inputs[1].value = inputs[0].value;
    validateDates();
  } else if (sample === "network") {
    datePanel
      ?.querySelector("[data-date-send-error]")
      ?.removeAttribute("hidden");
    const submit = datePanel?.querySelector("[data-submit-date]");

    if (submit) submit.textContent = "Повторить";
  } else if (sample === "long") {
    document.querySelectorAll(".extended-task h3").forEach((title) => {
      title.textContent =
        "Заказать пиццу для всей компании, уточнить у каждого ограничения по еде и договориться о доставке к началу встречи";
    });
  }
};

setupExtendedDraft();
