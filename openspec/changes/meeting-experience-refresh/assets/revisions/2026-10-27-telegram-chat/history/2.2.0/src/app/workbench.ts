const preview = document.querySelector<HTMLIFrameElement>("#preview")!;
const holder = document.querySelector<HTMLElement>("#viewport-holder")!;
const area = document.querySelector<HTMLElement>(".preview-area")!;
let viewport = { width: 390, height: 844 };

const fitPreview = (): void => {
  const style = getComputedStyle(area);
  const availableWidth =
    area.clientWidth -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight);
  const caption = document.querySelector<HTMLElement>(".preview-caption")!;
  const availableHeight = Math.max(
    200,
    innerHeight -
      area.getBoundingClientRect().top -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom) -
      caption.offsetHeight -
      10,
  );
  const scale = Math.min(
    1,
    availableWidth / viewport.width,
    availableHeight / viewport.height,
  );
  holder.style.width = `${viewport.width * scale}px`;
  holder.style.height = `${viewport.height * scale}px`;
  holder.style.borderRadius = `${(viewport.width > 740 ? 12 : 28) * scale}px`;
  preview.style.width = `${viewport.width}px`;
  preview.style.height = `${viewport.height}px`;
  preview.style.transform = `scale(${scale})`;
  caption.style.width = `${viewport.width * scale}px`;
  document.querySelector("#size-label")!.textContent =
    `${viewport.width} × ${viewport.height}`;
  document.querySelector("#scale-label")!.textContent =
    `Масштаб ${(scale * 100).toFixed(1)}%`;
};

const send = (message: Record<string, string | boolean>): void => {
  preview.contentWindow?.postMessage(message, location.origin);
};

document
  .querySelectorAll<HTMLButtonElement>("[data-width]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const width = button.dataset.width ?? "390";
      const height = button.dataset.height ?? "844";
      viewport = { width: Number(width), height: Number(height) };
      fitPreview();
      document
        .querySelectorAll("[data-width]")
        .forEach((item) => item.classList.toggle("active", item === button));
    });
  });

document
  .querySelectorAll<HTMLButtonElement>("[data-scenario]")
  .forEach((button) => {
    button.addEventListener("click", () =>
      send({ kind: "scenario", scenario: button.dataset.scenario ?? "chat" }),
    );
  });

document
  .querySelector<HTMLSelectElement>("#role")!
  .addEventListener("change", (event) =>
    send({ kind: "role", role: (event.target as HTMLSelectElement).value }),
  );
document
  .querySelector<HTMLSelectElement>("#task")!
  .addEventListener("change", (event) =>
    send({ kind: "task", task: (event.target as HTMLSelectElement).value }),
  );
document
  .querySelector<HTMLInputElement>("#place-poll")!
  .addEventListener("change", (event) =>
    send({
      kind: "place-poll",
      active: (event.target as HTMLInputElement).checked,
    }),
  );
document.querySelector("#reset")!.addEventListener("click", () => {
  preview.src = "chat.html";
  document.querySelector<HTMLSelectElement>("#role")!.value = "sasha";
  document.querySelector<HTMLSelectElement>("#task")!.value = "proposed";
  document.querySelector<HTMLInputElement>("#place-poll")!.checked = true;
});

window.addEventListener("resize", fitPreview);
fitPreview();
