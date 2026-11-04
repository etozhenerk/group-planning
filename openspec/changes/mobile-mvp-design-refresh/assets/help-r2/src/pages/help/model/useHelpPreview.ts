import { z } from "zod";
import { attachmentFixture } from "@h/model/attachmentFixture";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { FeedbackKind, FeedbackScreen, Screenshot } from "@h/model/types";
import { descriptionProblem } from "@h/lib/descriptionValidation";
import { readScreenshot } from "@h/lib/readScreenshot";
export const useHelpPreview = () => {
  const platform =
    new URLSearchParams(location.search).get("platform") ?? "web";
  const mode = new URLSearchParams(location.search).get("state") ?? "help";
  const prefilled = [
    "form-filled",
    "form-error",
    "form-unknown",
    "sending",
    "success",
    "attachment",
  ].includes(mode);
  const [kind, setKind] = useState<FeedbackKind>("problem"),
    [screen, setScreen] = useState<FeedbackScreen>("other");
  const [description, setDescription] = useState(
      prefilled
        ? "Не открывается приглашение по ссылке. После входа вижу пустой экран."
        : "",
    ),
    [email, setEmail] = useState("");
  const [diagnostics, setDiagnostics] = useState(false),
    [screenshot, setScreenshot] = useState<Screenshot | null>(
      mode === "attachment" ? attachmentFixture : null,
    ),
    [fileError, setFileError] = useState(
      mode === "file-error" ? "Выберите PNG, JPEG или WebP." : "",
    ),
    [reading, setReading] = useState(false);
  const [attempted, setAttempted] = useState(mode === "validation"),
    [phase, setPhase] = useState(
      mode === "success"
        ? "success"
        : mode === "sending"
          ? "sending"
          : mode === "form-error"
            ? "error"
            : mode === "form-unknown"
              ? "unknown"
              : "idle",
    );
  const [opened, setOpened] = useState<number[]>([0]);
  const feedbackScroll = useRef(0);
  const scroll = useRef(0),
    field = useRef<HTMLTextAreaElement>(null),
    timer = useRef<number | undefined>(undefined);
  const choose = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setFileError("");
    try {
      setScreenshot(await readScreenshot(file));
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Не удалось открыть файл.");
    } finally {
      setReading(false);
    }
  };
  const emailProblem =
    attempted && email.trim() && !z.email().safeParse(email.trim()).success
      ? "Проверьте адрес почты."
      : "";
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (descriptionProblem(description)) {
      field.current?.focus();
      return;
    }
    if (email.trim() && !z.email().safeParse(email.trim()).success) {
      document.querySelector<HTMLInputElement>("[name=email]")?.focus();
      return;
    }
    setPhase("sending");
    timer.current = window.setTimeout(
      () =>
        setPhase(
          mode === "form-error"
            ? "error"
            : mode === "form-unknown"
              ? "unknown"
              : "success",
        ),
      800,
    );
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const reset = () => {
    setDescription("");
    setEmail("");
    setScreenshot(null);
    setFileError("");
    setDiagnostics(false);
    setAttempted(false);
    setPhase("idle");
    feedbackScroll.current = 0;
  };
  return {
    platform,
    reset,
    feedbackScroll,
    emailProblem,
    mode,
    kind,
    setKind,
    screen,
    setScreen,
    description,
    setDescription,
    email,
    setEmail,
    diagnostics,
    setDiagnostics,
    screenshot,
    setScreenshot,
    fileError,
    reading,
    choose,
    phase,
    setPhase,
    submit,
    problem: attempted ? descriptionProblem(description) : "",
    field,
    opened,
    setOpened,
    scroll,
  };
};
export type HelpModel = ReturnType<typeof useHelpPreview>;
