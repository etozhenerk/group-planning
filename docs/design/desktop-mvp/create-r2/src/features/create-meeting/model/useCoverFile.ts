import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

export const useCoverFile = (
  onChange: (value: string) => void,
  onBusy: (busy: boolean) => void,
) => {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    event.target.value = "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Выберите фото в формате JPG, PNG или WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Выберите фото до 5 МБ");
      return;
    }
    setError("");
    onBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
      onBusy(false);
    };
    reader.onerror = () => {
      setError("Не удалось открыть фото. Выберите его ещё раз.");
      onBusy(false);
    };
    reader.readAsDataURL(file);
  };
  return { input, error, choose };
};
