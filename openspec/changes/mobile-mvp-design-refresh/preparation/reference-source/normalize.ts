// Только производные макеты. Этот адаптер не подключается к клиентам.
// Исходные snapshots и React-обработчики примера остаются на месте.
const svg = (content: string) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  element.setAttribute("viewBox", "0 0 24 24");
  element.setAttribute("aria-hidden", "true");
  element.innerHTML = content;
  return element;
};

const demoPhotos: Record<string, string> = {
  Саша: "sasha.jpg",
  Лена: "lena.jpg",
  Миша: "misha.jpg",
};

// Один adjustable control сохраняет восемь видимых точек и прямой выбор страницы.
// Отдельные цели 27px не выдаются за 44/48px. Только адаптер макета.
const normalizeProgress = () => {
  const root = document.querySelector<HTMLElement>("[data-onboarding]");
  const progress = root?.querySelector<HTMLElement>("footer > div");
  if (!root || !progress || progress.dataset.mobileProgress) return;
  const buttons = [
    ...progress.querySelectorAll<HTMLButtonElement>(
      'button[aria-label^="Слайд "]',
    ),
  ];
  if (buttons.length !== 8) return;
  progress.dataset.mobileProgress = "true";
  buttons.forEach((button) => {
    button.setAttribute("aria-hidden", "true");
    button.tabIndex = -1;
  });
  const input = document.createElement("input");
  input.type = "range";
  input.min = "1";
  input.max = String(buttons.length);
  input.step = "1";
  input.setAttribute("aria-label", "Страница знакомства");
  const update = () => {
    const slides = [...root.querySelectorAll("[data-page-track] > section")];
    const selected = Math.max(
      0,
      slides.findIndex(
        (slide) => slide.getAttribute("aria-hidden") === "false",
      ),
    );
    input.value = String(selected + 1);
    input.setAttribute(
      "aria-valuetext",
      `Шаг ${selected + 1} из ${buttons.length}`,
    );
    const disabled = buttons[0].disabled;
    if (input.disabled !== disabled) input.disabled = disabled;
  };
  input.addEventListener("input", () =>
    buttons[Number(input.value) - 1]?.click(),
  );
  progress.append(input);
  update();
  new MutationObserver(update).observe(root, {
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-hidden", "disabled"],
  });
};

const normalize = () => {
  normalizeProgress();
  document
    .querySelectorAll<HTMLElement>('nav[aria-label="Основная навигация"]')
    .forEach((nav) => {
      const style = getComputedStyle(nav);
      if (style.position === "fixed" && style.bottom !== "auto") {
        nav.dataset.mobileFixedPanel = "true";
        const host = nav.parentElement;
        if (
          host?.children.length === 1 &&
          getComputedStyle(host).transform !== "none"
        ) {
          // Старый макет резервировал home area снаружи fixed-панели.
          // Сохраняем место для строк, продолжаем её фон до нижнего края.
          nav.style.setProperty(
            "--reference-bottom-safe-area",
            `${Math.max(0, innerHeight - host.getBoundingClientRect().bottom)}px`,
          );
          host.dataset.mobileFixedPanelHost = "true";
        }
      }
    });

  // 04.11: карты вынесены пользователем в отдельную проработку.
  document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    if (button.textContent?.trim() === "Выбрать на карте") {
      button.remove();
    }
  });

  document
    .querySelectorAll<HTMLElement>('[data-testid="avatar"]')
    .forEach((avatar) => {
      if (avatar.querySelector("img, svg")) {
        return;
      }
      const title =
        avatar.parentElement?.getAttribute("title") ??
        avatar.parentElement?.textContent ??
        "";
      const matches = Object.entries(demoPhotos).filter(([name]) =>
        title.includes(name),
      );
      const photo = matches.length === 1 ? matches[0][1] : undefined;
      if (photo && avatar.dataset.mobilePhotoFailed !== "true") {
        const image = new Image();
        image.alt = "";
        image.src = new URL(
          "../../../assets/info-r2/avatars/" + photo,
          window.location.href,
        ).href;
        image.addEventListener(
          "error",
          () => {
            avatar.dataset.mobilePhotoFailed = "true";
            image.remove();
          },
          { once: true },
        );
        avatar.dataset.mobilePhoto = "true";
        avatar.replaceChildren(image);
        return;
      }
      avatar.replaceChildren(
        svg(
          '<circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 22v-2a8 8 0 0 1 16 0v2Z" fill="currentColor"/>',
        ),
      );
      avatar.dataset.mobileSilhouette = "true";
    });

  document
    .querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a")
    .forEach((button) => {
      const label = button.textContent?.trim();
      const accessible = button.getAttribute("aria-label");
      const mapBack =
        accessible === "К предложению места" ||
        accessible === "К созданию встречи";
      if (
        !label?.startsWith("←") &&
        label !== "Назад" &&
        (!mapBack || button.dataset.mobileBack)
      ) {
        return;
      }
      // Локальный обработчик перехода сохранён. Новый вид — принятое navigation-r2.
      button.setAttribute(
        "aria-label",
        mapBack
          ? (accessible ?? "К форме")
          : (document.body.dataset.backLabel ??
              accessible ??
              label?.replace(/^←\s*/, "") ??
              "На предыдущий экран"),
      );
      button.dataset.mobileBack = "true";
      const icon = svg(
        '<path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
      );
      button.replaceChildren(icon);
    });
};

const start = () => {
  document.documentElement.dataset.inputModality = "pointer";
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Tab") {
        document.documentElement.dataset.inputModality = "keyboard";
      }
    },
    true,
  );
  document.addEventListener(
    "pointerdown",
    () => {
      document.documentElement.dataset.inputModality = "pointer";
    },
    true,
  );
  const parameters = new URLSearchParams(window.location.search);
  const platform = parameters.get("platform");
  if (platform && ["web", "ios", "android"].includes(platform)) {
    document.documentElement.dataset.previewPlatform = platform;
  }
  const entryState = parameters.get("entry-state");
  if (
    entryState &&
    ["busy", "error", "cancelled", "success"].includes(entryState)
  ) {
    document.body.dataset.entryState = entryState;
    // Управление только fixture: не подмена OAuth и не продуктовая кнопка отмены.
    window.setTimeout(
      () => window.dispatchEvent(new Event("onboarding-preview-error")),
      150,
    );
  }
  normalize();
  const observer = new MutationObserver(normalize);
  observer.observe(document.body, { childList: true, subtree: true });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
