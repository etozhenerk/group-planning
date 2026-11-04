document.addEventListener("click", (event: MouseEvent) => {
  const target =
    event.target instanceof Element ? event.target.closest("button") : null;
  if (
    target?.getAttribute("aria-label") === "К моим встречам" ||
    target?.getAttribute("title") === "Мои встречи"
  )
    location.href = "../preview.html";
});
