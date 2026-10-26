// Только навигация статичного макета. Сетевых операций и имитации API здесь нет.
const setupRevision = () => {
  const dialog = document.querySelector<HTMLDialogElement>(".revision-sheet");
  const menu = document.querySelector<HTMLElement>("[data-revision-menu]");
  const workspace = document.querySelector<HTMLElement>(".workspace");
  const mobile = matchMedia("(max-width: 739px)");
  const views = [...document.querySelectorAll<HTMLElement>("[data-view]")];

  if (!dialog || !menu || !workspace) {
    return;
  }

  const files = new Map(
    views.map((view) => [view.dataset.view, view.dataset.file]),
  );
  const kinds = new Map(
    views.map((view) => [view.dataset.file, view.dataset.view]),
  );
  const origin = location.href;
  const initial = document.body.dataset.initial ?? "";
  let previous: HTMLElement | null = null;
  let chain: string[] = [];
  let modal = false;

  const updateViewport = () => {
    const viewport = window.visualViewport;
    const height = viewport?.height ?? window.innerHeight;
    const bottom = Math.max(
      0,
      window.innerHeight - height - (viewport?.offsetTop ?? 0),
    );
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
        } else {
          dialog.show();
        }
      }

      view
        .querySelector<HTMLElement>(
          mobile.matches ? ".revision-close" : ".revision-back, a, input",
        )
        ?.focus({ preventScroll: true });
    } else if (wasOpen) {
      previous?.focus({ preventScroll: true });
    }

    document.documentElement.style.overflow =
      view && mobile.matches ? "hidden" : "";
    document.body.dataset.revisionReady = "true";
    updateViewport();
  };

  const pathFor = (next: string[]) => {
    const active = next.at(-1) ?? "";

    return new URL(
      active === "menu" ? "chat-menu.html" : (files.get(active) ?? "chat.html"),
      origin,
    );
  };

  const navigate = (next: string[], replace = false) => {
    chain = next;
    const state = { chatSheetRevision: true, chain };

    if (replace) {
      history.replaceState(state, "", pathFor(next));
    } else {
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

    const link = event.target.closest<HTMLAnchorElement>("a[href]");

    if (
      !link ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }

    const url = new URL(link.href);
    const file = url.pathname.split("/").at(-1);
    const sameDirectory =
      new URL(".", link.href).href === new URL(".", origin).href;

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
    navigate(
      replacing ? [...chain.slice(0, -1), next] : [...chain, next],
      !!replacing,
    );
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (mobile.matches && event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();

      if (
        event.clientY < bounds.top ||
        event.clientX < bounds.left ||
        event.clientX > bounds.right
      ) {
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
  window.addEventListener("popstate", (event: PopStateEvent) => {
    const saved = event.state as {
      chatSheetRevision?: boolean;
      chain?: string[];
    } | null;
    chain =
      saved?.chatSheetRevision && Array.isArray(saved.chain) ? saved.chain : [];
    paint();
  });
  mobile.addEventListener("change", paint);
  window.visualViewport?.addEventListener("resize", updateViewport);
  window.visualViewport?.addEventListener("scroll", updateViewport);

  const saved = history.state as {
    chatSheetRevision?: boolean;
    chain?: string[];
  } | null;

  if (saved?.chatSheetRevision && Array.isArray(saved.chain)) {
    chain = saved.chain;
    paint();
  } else {
    navigate([], true);

    if (initial) {
      navigate([initial]);
    }
  }
};

setupRevision();
