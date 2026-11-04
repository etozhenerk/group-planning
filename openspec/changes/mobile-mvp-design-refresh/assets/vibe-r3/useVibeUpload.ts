import { useEffect, useRef, useState } from "react";
import { initialPhotos } from "@preview/data";
import type { Photo } from "@preview/data";
export type UploadItem = {
  id: string;
  src: string;
  name: string;
  error: string;
  type: string;
};
export const useVibeUpload = (
  mode: string,
  publish: (photos: Photo[]) => void,
  close: () => void,
) => {
  const seed = () =>
    ["upload-selected", "upload-error"].includes(mode)
      ? initialPhotos
          .slice(1)
          .map((photo) => ({ ...photo, id: "draft-" + photo.id, error: "" }))
      : mode === "partial"
        ? [
            {
              ...initialPhotos[2],
              id: "draft-failed",
              error: "Не удалось добавить фото.",
            },
          ]
        : [];
  const [items, setItems] = useState<UploadItem[]>(seed),
    [busy, setBusy] = useState(false),
    [problem, setProblem] = useState(
      mode === "upload-error"
        ? "Не удалось добавить фото. Выбранные снимки остались в форме."
        : mode === "partial"
          ? "Остальные снимки уже в альбоме. Повтор добавит только оставшийся."
          : "",
    );
  const timer = useRef<number | undefined>(),
    lock = useRef(false),
    completed = useRef(false),
    urls = useRef<string[]>([]);
  useEffect(() => {
    window.clearTimeout(timer.current);
    lock.current = false;
    completed.current = false;
    setItems(seed());
    setBusy(false);
    setProblem(
      mode === "upload-error"
        ? "Не удалось добавить фото. Выбранные снимки остались в форме."
        : mode === "partial"
          ? "Остальные снимки уже в альбоме. Повтор добавит только оставшийся."
          : "",
    );
  }, [mode]);
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  const choose = (files: FileList | null) => {
    if (!files?.length || busy) return;
    const incoming = [...files].map((file) => {
      const src = URL.createObjectURL(file);
      urls.current.push(src);
      return {
        id: crypto.randomUUID(),
        src,
        name: file.name,
        type: file.type,
        error: file.type.startsWith("image/")
          ? ""
          : "Выберите файл изображения.",
      };
    });
    setItems((previous) => [...previous, ...incoming]);
    setProblem("");
  };
  const send = () => {
    if (
      lock.current ||
      !items.length ||
      items.some((item) => item.error && !item.error.startsWith("Не удалось"))
    )
      return;
    lock.current = true;
    setBusy(true);
    setProblem("");
    timer.current = window.setTimeout(() => {
      publish(
        items.map((item) => ({
          id: "uploaded-" + item.id,
          src: item.src,
          name: item.name,
          author: "Миша",
          type: item.type,
        })),
      );
      completed.current = true;
      setBusy(false);
      lock.current = false;
      close();
    }, 800);
  };
  return {
    begin: () => {
      if (completed.current) {
        completed.current = false;
        setItems([]);
        setProblem("");
      }
    },
    items,
    busy,
    problem,
    choose,
    send,
    remove: (id: string) => {
      if (!busy) {
        setItems((previous) => previous.filter((item) => item.id !== id));
        setProblem("");
      }
    },
  };
};
