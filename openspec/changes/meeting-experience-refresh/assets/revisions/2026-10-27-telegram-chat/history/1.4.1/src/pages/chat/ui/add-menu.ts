import { icon } from "@prototype/shared/lib/dom";

export const addMenu = (): string =>
  [
    ["photo", "Фото", "photo"],
    ["file", "Файл", "file"],
    ["date", "Предложить дату", "calendar"],
    ["place", "Предложить место", "pin"],
    ["new-task", "Предложить задачу", "task"],
  ]
    .map(
      ([action, label, image]) =>
        `<button type="button" data-action="open-${action}">${icon(image!)}<span>${label}</span></button>`,
    )
    .join("");
