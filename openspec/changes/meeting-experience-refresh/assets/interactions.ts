// Только взаимодействие UX-макета: локальные иллюстративные фото, без API.
const setupPhotoStack = (): void => {
  const stage = document.querySelector(".photo-stack");
  const front = document.querySelector(".stack-front");
  const picture = front?.querySelector("img");
  const previous = document.querySelector(".back-one");
  const next = document.querySelector(".back-two");
  const controls = document.querySelector(".stack-meta");

  if (
    !(stage instanceof HTMLElement) ||
    !(front instanceof HTMLAnchorElement) ||
    !(picture instanceof HTMLImageElement) ||
    !(previous instanceof HTMLImageElement) ||
    !(next instanceof HTMLImageElement) ||
    !(controls instanceof HTMLElement)
  ) {
    return;
  }

  front.draggable = false;
  picture.draggable = false;
  front.addEventListener("dragstart", (event: DragEvent) =>
    event.preventDefault(),
  );
  const photos = ["friends.png", "boardgame.png", "dinner.png"];
  const initial = front.href.match(/photo-(\d)/);
  let current = Number(initial?.[1] ?? 1) - 1;
  let moving = false;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let delta = 0;
  let pointer: number | null = null;
  let suppressClickUntil = 0;
  const counter = controls.querySelector("span");
  const reducedMotion = (): boolean =>
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  const paint = (): void => {
    picture.src = photos[current] ?? photos[0] ?? "";
    picture.alt = `Фото ${current + 1} со встречи`;
    previous.src = photos[(current + 2) % 3] ?? "";
    next.src = photos[(current + 1) % 3] ?? "";
    front.href = `photo-${current + 1}.html`;
    front.setAttribute(
      "aria-label",
      `Открыть фото ${current + 1} на весь экран`,
    );
    front.classList.toggle("portrait", current === 2);
    front.style.transform = "";
    stage.classList.remove("is-dragging", "is-moving");

    if (counter) {
      counter.textContent = `${current + 1} / ${photos.length}`;
      counter.setAttribute("aria-live", "polite");
    }
  };

  const turn = async (direction: number): Promise<void> => {
    if (moving) {
      return;
    }

    moving = true;
    stage.classList.add("is-moving");
    const duration = reducedMotion() ? 0 : 290;
    const outgoing = front.animate(
      [
        { transform: getComputedStyle(front).transform, opacity: 1 },
        {
          transform: `translate(calc(-50% + ${-direction * stage.clientWidth}px), -44%) rotate(${-direction * 19}deg)`,
          opacity: 0,
        },
      ],
      { duration, easing: "cubic-bezier(.3,.7,.3,1)", fill: "forwards" },
    );
    const incoming = (direction > 0 ? next : previous).animate(
      [
        {
          transform: getComputedStyle(direction > 0 ? next : previous)
            .transform,
          opacity: 0.8,
        },
        { transform: "translate(-50%, -50%) rotate(-1.5deg)", opacity: 1 },
      ],
      { duration, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
    await outgoing.finished.catch(() => undefined);
    current = (current + direction + photos.length) % photos.length;
    paint();
    outgoing.cancel();
    incoming.cancel();
    moving = false;
  };

  const settle = (): void => {
    front.animate(
      [
        { transform: getComputedStyle(front).transform },
        { transform: "translate(-50%, -50%) rotate(-1.5deg)" },
      ],
      {
        duration: reducedMotion() ? 0 : 230,
        easing: "cubic-bezier(.2,.8,.2,1)",
      },
    );
    front.style.transform = "";
    stage.classList.remove("is-dragging");
  };

  front.addEventListener("pointerdown", (event: PointerEvent) => {
    if (moving || event.button !== 0) {
      return;
    }

    pointer = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startTime = performance.now();
    delta = 0;
    front.setPointerCapture(event.pointerId);
  });

  front.addEventListener("pointermove", (event: PointerEvent) => {
    if (pointer !== event.pointerId || moving) {
      return;
    }

    delta = event.clientX - startX;
    const vertical = event.clientY - startY;

    if (Math.abs(delta) < 6 || Math.abs(vertical) > Math.abs(delta)) {
      return;
    }

    stage.classList.add("is-dragging");
    front.style.transform = `translate(calc(-50% + ${delta}px), calc(-50% + ${vertical * 0.12}px)) rotate(${delta / 22 - 1.5}deg)`;
    suppressClickUntil = performance.now() + 500;
  });

  front.addEventListener("pointerup", (event: PointerEvent) => {
    if (pointer !== event.pointerId) {
      return;
    }

    pointer = null;
    const speed = Math.abs(delta) / Math.max(1, performance.now() - startTime);

    if (Math.abs(delta) > 60 || (Math.abs(delta) > 20 && speed > 0.45)) {
      void turn(delta < 0 ? 1 : -1);
    } else {
      settle();
    }
  });

  front.addEventListener("pointercancel", () => {
    pointer = null;
    settle();
  });

  front.addEventListener("click", (event: MouseEvent) => {
    if (performance.now() < suppressClickUntil || moving) {
      event.preventDefault();
    }
  });

  stage.tabIndex = 0;
  stage.setAttribute(
    "aria-label",
    "Фотографии встречи. Стрелки влево и вправо переключают фото.",
  );
  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("input, textarea, select, [contenteditable=true]")
    ) {
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      void turn(event.key === "ArrowLeft" ? -1 : 1);
    }
  });

  paint();
};

setupPhotoStack();

const setupBottomNavigation = (): void => {
  const navigation = document.querySelector(".bottom-nav");

  if (!(navigation instanceof HTMLElement)) {
    return;
  }

  const links = [...navigation.querySelectorAll("a")];
  const selected = Math.max(
    0,
    links.findIndex((link) => link.classList.contains("active")),
  );
  const marker = document.createElement("span");
  marker.className = "nav-marker";
  marker.setAttribute("aria-hidden", "true");
  marker.style.transform = `translateX(${selected * 100}%)`;
  navigation.prepend(marker);
  links[selected]?.setAttribute("aria-current", "page");
  let moving = false;

  links.forEach((link, index) => {
    link.addEventListener("click", async (event: MouseEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        index === selected
      ) {
        return;
      }

      event.preventDefault();

      if (moving) {
        return;
      }

      moving = true;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced ? 0 : 260;
      links.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
      const motion = marker.animate(
        [
          { transform: `translateX(${selected * 100}%)` },
          { transform: `translateX(${index * 100}%)` },
        ],
        { duration, easing: "cubic-bezier(.2,.85,.25,1.12)", fill: "forwards" },
      );
      link
        .querySelector("svg")
        ?.animate(
          [
            { transform: "translateY(0) scale(.94)" },
            { transform: "translateY(-1px) scale(1.08)" },
            { transform: "translateY(0) scale(1)" },
          ],
          { duration, easing: "ease-out" },
        );
      await motion.finished.catch(() => undefined);
      window.location.assign(link.href);
    });
  });
};

setupBottomNavigation();

const setupPhotoViewer = (): void => {
  const photo = document.querySelector(".viewer-photo");
  const counter = document.querySelector(".viewer-head .caption");
  const close = document.querySelector(".viewer-head a");

  if (
    !(photo instanceof HTMLImageElement) ||
    !(counter instanceof HTMLElement) ||
    !(close instanceof HTMLAnchorElement)
  ) {
    return;
  }

  const photos = ["friends.png", "boardgame.png", "dinner.png"];
  photo.draggable = false;
  let current = Number(photo.dataset.photo ?? 0);
  let origin = 0;
  let displacement = 0;
  let pointer: number | null = null;
  let moving = false;
  const duration = (): number =>
    matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240;
  const paint = (): void => {
    photo.src = photos[current] ?? "";
    photo.alt = `Фото ${current + 1} со встречи`;
    counter.textContent = `24 октября · ${current + 1} / 3`;
    counter.setAttribute("aria-live", "polite");
    close.href = current === 0 ? "album.html" : `album-${current + 1}.html`;
  };
  const turn = async (direction: number): Promise<void> => {
    if (moving) {
      return;
    }

    moving = true;
    const outgoing = photo.animate(
      [
        { transform: getComputedStyle(photo).transform, opacity: 1 },
        { transform: `translateX(${-direction * 80}px)`, opacity: 0 },
      ],
      { duration: duration(), easing: "ease-out", fill: "forwards" },
    );
    await outgoing.finished.catch(() => undefined);
    current = (current + direction + photos.length) % photos.length;
    paint();
    photo.style.transform = "";
    outgoing.cancel();
    const incoming = photo.animate(
      [
        { transform: `translateX(${direction * 80}px)`, opacity: 0 },
        { transform: "translateX(0)", opacity: 1 },
      ],
      { duration: duration(), easing: "ease-out" },
    );
    await incoming.finished.catch(() => undefined);
    moving = false;
  };
  photo.addEventListener("pointerdown", (event: PointerEvent) => {
    if (moving || event.button !== 0) {
      return;
    }

    pointer = event.pointerId;
    origin = event.clientX;
    displacement = 0;
    photo.setPointerCapture(pointer);
  });
  photo.addEventListener("pointermove", (event: PointerEvent) => {
    if (event.pointerId === pointer) {
      displacement = event.clientX - origin;
      photo.style.transform = `translateX(${displacement}px)`;
    }
  });
  photo.addEventListener("pointerup", () => {
    if (pointer === null) {
      return;
    }

    pointer = null;
    if (Math.abs(displacement) > 50) {
      void turn(displacement < 0 ? 1 : -1);
    } else {
      photo.style.transform = "";
    }
  });
  photo.addEventListener("pointercancel", () => {
    pointer = null;
    photo.style.transform = "";
  });
  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      window.location.assign(close.href);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      void turn(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  paint();
};

setupPhotoViewer();

const setupCalendar = (): void => {
  const days = document.querySelector(".calendar-days");
  const monthLabel = document.querySelector("#calendar-month");
  const dayLabel = document.querySelector("#calendar-day-label");
  const count = document.querySelector("#calendar-day-count");
  const meetings = document.querySelector("#calendar-meetings");

  if (
    !(days instanceof HTMLElement) ||
    !monthLabel ||
    !dayLabel ||
    !count ||
    !meetings
  ) {
    return;
  }

  const templates = [
    ...document.querySelectorAll<HTMLTemplateElement>(
      "template[data-meeting-date]",
    ),
  ];
  const period =
    new URLSearchParams(location.search).get("period") === "past"
      ? "past"
      : "upcoming";
  let year = 2026;
  let month = 9;
  let selected = period === "past" ? "2026-10-24" : "2026-10-31";
  const key = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const available = templates.filter(
    (template) => template.dataset.period === period,
  );
  document
    .querySelectorAll<HTMLElement>("[data-calendar-period]")
    .forEach((link) => {
      link.classList.toggle("selected", link.dataset.calendarPeriod === period);
    });

  const render = (): void => {
    const first = new Date(year, month, 1);
    const label = first
      .toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
      .replace(" г.", "");
    monthLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    days.replaceChildren();
    const offset = (first.getDay() + 6) % 7;
    const length =
      Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
    for (let index = 0; index < length; index += 1) {
      const date = new Date(year, month, 1 - offset + index);
      const dateKey = key(date);
      const items = available.filter(
        (template) => template.dataset.meetingDate === dateKey,
      );
      const button = document.createElement("button");
      button.textContent = String(date.getDate());
      button.classList.toggle("outside", date.getMonth() !== month);
      button.classList.toggle(
        "weekend",
        date.getDay() === 0 || date.getDay() === 6,
      );
      button.classList.toggle("has-event", items.length > 0);
      button.setAttribute("aria-pressed", String(selected === dateKey));
      button.setAttribute(
        "aria-label",
        `${date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}${items.length ? ", есть встреча" : ""}`,
      );
      button.addEventListener("click", () => {
        selected = dateKey;
        year = date.getFullYear();
        month = date.getMonth();
        render();
      });
      days.append(button);
    }
    const selectedDate = new Date(`${selected}T12:00:00`);
    dayLabel.textContent = selectedDate.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
    const chosen = available.filter(
      (template) => template.dataset.meetingDate === selected,
    );
    count.textContent = chosen.length ? `${chosen.length} встреча` : "";
    meetings.replaceChildren();
    chosen.forEach((template) =>
      meetings.append(template.content.cloneNode(true)),
    );
    if (!chosen.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      const title = document.createElement("h2");
      title.textContent = "На этот день встреч нет";
      empty.append(title);
      meetings.append(empty);
    }
  };
  document.querySelector(".calendar-today")?.addEventListener("click", () => {
    // Фиксированная дата демонстрационного набора.
    year = 2026;
    month = 9;
    selected = "2026-10-25";
    render();
  });
  document
    .querySelectorAll<HTMLElement>("[data-month-step]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const date = new Date(
          year,
          month + Number(button.dataset.monthStep),
          1,
        );
        year = date.getFullYear();
        month = date.getMonth();
        selected = key(date);
        render();
      });
    });
  render();
};

setupCalendar();
