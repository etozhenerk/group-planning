// Только локальное поведение макета. Сети, бота и отправки файлов здесь нет.
const setupSupportForm = (): void => {
  const form = document.querySelector(".support-form");
  if (!(form instanceof HTMLFormElement)) return;
  const description = form.elements.namedItem("description");
  const email = form.elements.namedItem("email");
  const screenshot = form.elements.namedItem("screenshot");
  const error = document.querySelector("#report-error");
  const preview = document.querySelector(".attachment-choice");
  const submit = form.querySelector('button[type="submit"]');
  if (
    !(description instanceof HTMLTextAreaElement) ||
    !(email instanceof HTMLInputElement) ||
    !(screenshot instanceof HTMLInputElement) ||
    !(error instanceof HTMLElement) ||
    !(preview instanceof HTMLElement) ||
    !(submit instanceof HTMLButtonElement)
  )
    return;
  submit.disabled = false;
  const params = new URLSearchParams(location.search);
  const kind = params.get("kind");
  if (kind === "idea" || kind === "question") {
    const input = form.querySelector(`input[value="${kind}"]`);
    if (input instanceof HTMLInputElement) input.checked = true;
  }
  const screen = form.elements.namedItem("screen");
  if (params.get("screen") === "chat" && screen instanceof HTMLSelectElement)
    screen.value = "Чат встречи";
  const heading = document.querySelector(".service-heading h1");
  const intro = document.querySelector(".service-heading p");
  const updateLabel = (): void => {
    const selected = form.querySelector<HTMLInputElement>(
      'input[name="kind"]:checked',
    )?.value;
    if (heading)
      heading.textContent =
        selected === "idea"
          ? "Есть идея?"
          : selected === "question"
            ? "Нужна помощь?"
            : "Что-то пошло не так?";
    if (intro)
      intro.textContent =
        selected === "idea"
          ? "Расскажите, чего вам не хватает или что можно улучшить."
          : selected === "question"
            ? "Опишите, с чем возник вопрос."
            : "Расскажите, что случилось. Это поможет разобраться.";
    description.placeholder =
      selected === "idea"
        ? "Чего вам не хватает в somewhere?"
        : selected === "question"
          ? "С чем нужна помощь?"
          : "Что вы делали и что пошло не так";
  };
  form
    .querySelectorAll('input[name="kind"]')
    .forEach((input) => input.addEventListener("change", updateLabel));
  updateLabel();
  let objectUrl: string | undefined;
  const clearAttachment = (): void => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = undefined;
    screenshot.value = "";
    preview.hidden = true;
    preview.querySelector("img")?.removeAttribute("src");
  };
  const showError = (message: string): void => {
    error.textContent = message;
    error.hidden = false;
  };
  screenshot.addEventListener("change", () => {
    const file = screenshot.files?.[0];
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      clearAttachment();
      showError("Выберите PNG, JPG или WebP размером до 5 МБ.");
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    const image = preview.querySelector("img");
    const name = preview.querySelector("span");
    if (image) image.src = objectUrl;
    if (name) name.textContent = file.name;
    preview.hidden = false;
    error.hidden = true;
  });
  form
    .querySelector("[data-remove-attachment]")
    ?.addEventListener("click", clearAttachment);
  form.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();
    description.removeAttribute("aria-invalid");
    email.removeAttribute("aria-invalid");
    if (description.value.trim().length < 10) {
      showError("Добавьте описание — хотя бы 10 символов.");
      description.setAttribute("aria-invalid", "true");
      description.focus();
      return;
    }
    if (email.value && !email.validity.valid) {
      showError("Проверьте адрес почты или оставьте поле пустым.");
      email.setAttribute("aria-invalid", "true");
      email.focus();
      return;
    }
    error.hidden = true;
    // Состояние успеха — демонстрационное, введённые значения не передаются.
    window.location.assign("report-success.html");
  });
  window.addEventListener("pagehide", () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  });
};

setupSupportForm();
