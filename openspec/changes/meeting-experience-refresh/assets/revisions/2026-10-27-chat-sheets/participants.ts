// Поведение только отдельного статичного дополнения: один и тот же info dialog.
const setupParticipants = () => {
  const toggle = document.querySelector<HTMLButtonElement>(
    "[data-participants-toggle]",
  );
  const expanded = document.querySelector<HTMLElement>(
    "[data-participants-expanded]",
  );
  const collapse = document.querySelector<HTMLButtonElement>(
    "[data-participants-collapse]",
  );
  const heading = document.querySelector<HTMLElement>(
    "[data-participants-heading]",
  );

  if (!toggle || !expanded || !collapse || !heading) {
    return;
  }

  const show = (open: boolean, focus: boolean) => {
    toggle.hidden = open;
    toggle.setAttribute("aria-expanded", String(open));
    expanded.hidden = !open;
    heading.textContent = open ? "Участники" : "Кто придёт";

    if (focus) {
      (open ? collapse : toggle).focus({ preventScroll: true });
    }
  };

  toggle.addEventListener("click", () => show(true, true));
  collapse.addEventListener("click", () => show(false, true));
  show(true, false);
};

setupParticipants();
