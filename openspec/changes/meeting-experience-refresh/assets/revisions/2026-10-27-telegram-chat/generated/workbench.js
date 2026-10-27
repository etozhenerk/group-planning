"use strict";
(() => {
  // openspec/changes/meeting-experience-refresh/assets/revisions/2026-10-27-telegram-chat/src/app/workbench.ts
  var preview = document.querySelector("#preview");
  var holder = document.querySelector("#viewport-holder");
  var area = document.querySelector(".preview-area");
  var viewport = { width: 390, height: 844 };
  var fitPreview = () => {
    const style = getComputedStyle(area);
    const availableWidth = area.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const caption = document.querySelector(".preview-caption");
    const availableHeight = Math.max(
      200,
      innerHeight - area.getBoundingClientRect().top - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - caption.offsetHeight - 10
    );
    const scale = Math.min(
      1,
      availableWidth / viewport.width,
      availableHeight / viewport.height
    );
    holder.style.width = `${viewport.width * scale}px`;
    holder.style.height = `${viewport.height * scale}px`;
    holder.style.borderRadius = `${(viewport.width > 740 ? 12 : 28) * scale}px`;
    preview.style.width = `${viewport.width}px`;
    preview.style.height = `${viewport.height}px`;
    preview.style.transform = `scale(${scale})`;
    caption.style.width = `${viewport.width * scale}px`;
    document.querySelector("#size-label").textContent = `${viewport.width} \xD7 ${viewport.height}`;
    document.querySelector("#scale-label").textContent = `\u041C\u0430\u0441\u0448\u0442\u0430\u0431 ${(scale * 100).toFixed(1)}%`;
  };
  var send = (message) => {
    preview.contentWindow?.postMessage(message, location.origin);
  };
  document.querySelectorAll("[data-width]").forEach((button) => {
    button.addEventListener("click", () => {
      const width = button.dataset.width ?? "390";
      const height = button.dataset.height ?? "844";
      viewport = { width: Number(width), height: Number(height) };
      fitPreview();
      document.querySelectorAll("[data-width]").forEach((item) => item.classList.toggle("active", item === button));
    });
  });
  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener(
      "click",
      () => send({ kind: "scenario", scenario: button.dataset.scenario ?? "chat" })
    );
  });
  document.querySelector("#role").addEventListener(
    "change",
    (event) => send({ kind: "role", role: event.target.value })
  );
  document.querySelector("#task").addEventListener(
    "change",
    (event) => send({ kind: "task", task: event.target.value })
  );
  document.querySelector("#place-poll").addEventListener(
    "change",
    (event) => send({
      kind: "place-poll",
      active: event.target.checked
    })
  );
  document.querySelector("#reset").addEventListener("click", () => {
    preview.src = "chat.html";
    document.querySelector("#role").value = "sasha";
    document.querySelector("#task").value = "proposed";
    document.querySelector("#place-poll").checked = true;
  });
  window.addEventListener("resize", fitPreview);
  fitPreview();
})();
