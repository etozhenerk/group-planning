import { useEffect, useRef, useState } from "react";
import type { Photo } from "@preview/data";
import { makeAlbumZip } from "@preview/lib/zip";
export const useAlbumExport = (
  photos: Photo[],
  mode: string,
  platform: string,
) => {
  const initial = () =>
    mode === "download-error"
      ? "error"
      : mode === "permission"
        ? "permission"
        : mode === "save-partial"
          ? "partial"
          : "idle";
  const [phase, setPhase] = useState(initial),
    controller = useRef<AbortController | null>(null),
    generation = useRef(0),
    timer = useRef<number | undefined>(),
    busy = useRef(false);
  const cancel = () => {
    generation.current++;
    controller.current?.abort();
    window.clearTimeout(timer.current);
    busy.current = false;
    setPhase("idle");
  };
  useEffect(() => {
    cancel();
    setPhase(initial());
  }, [mode, platform]);
  useEffect(
    () => () => {
      generation.current++;
      controller.current?.abort();
      window.clearTimeout(timer.current);
    },
    [],
  );
  const start = async () => {
    if (busy.current || !photos.length) return;
    busy.current = true;
    const epoch = ++generation.current,
      abort = new AbortController();
    controller.current = abort;
    setPhase("preparing");
    try {
      await new Promise<void>((resolve) => {
        timer.current = window.setTimeout(resolve, 600);
      });
      if (epoch !== generation.current) return;
      if (platform !== "web") {
        setPhase("writing");
        await new Promise<void>((resolve) => {
          timer.current = window.setTimeout(resolve, 700);
        });
        if (epoch === generation.current) {
          setPhase("saved");
          busy.current = false;
        }
        return;
      }
      const blob = await makeAlbumZip(photos, abort.signal);
      if (epoch !== generation.current) return;
      const url = URL.createObjectURL(blob),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "somewhere-30-10-2026.zip";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      setPhase("downloaded");
      busy.current = false;
    } catch (error) {
      if (epoch === generation.current) {
        setPhase("error");
        busy.current = false;
      }
    }
  };
  return { phase, start, cancel, dismiss: () => setPhase("idle") };
};
