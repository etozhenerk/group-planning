import { useEffect, useState } from "react";
import {useDeckMotion as useAlbum} from '@preview/useDeckMotion';
import { initialPhotos, initialMode, initialPlatform } from "@preview/data";
import type { Photo } from "@preview/data";
import { useVibeUpload } from "@preview/useVibeUpload";
import { useAlbumExport } from "@preview/useAlbumExport";
export const useVibe = () => {
  const [mode, setMode] = useState(initialMode),
    [platform, setPlatform] = useState(initialPlatform),
    [photos, setPhotos] = useState<Photo[]>(
      ["empty", "denied", "loading", "error"].includes(initialMode)
        ? []
        : initialPhotos,
    ),
    [uploading, setUploading] = useState(
      initialMode.startsWith("upload") || initialMode === "partial",
    ),
    [viewer, setViewer] = useState(
      initialMode === "viewer" ? 0 : (null as number | null),
    ),
    [recovered, setRecovered] = useState(false);
  const album = useAlbum(photos.length),
    publish = (next: Photo[]) =>
      setPhotos((previous) => [
        ...previous,
        ...next.filter((photo) => !previous.some((old) => old.id === photo.id)),
      ]),
    upload = useVibeUpload(mode, publish, () => setUploading(false)),
    download = useAlbumExport(photos, mode, platform);
  useEffect(() => {
    setPhotos(
      ["empty", "denied", "loading", "error"].includes(mode)
        ? []
        : mode === "partial"
          ? [...initialPhotos, { ...initialPhotos[1], id: "already-added" }]
          : initialPhotos,
    );
    setUploading(mode.startsWith("upload") || mode === "partial");
    setViewer(mode === "viewer" ? 0 : null);
    setRecovered(false);
    album.select(0);
    album.setGrid(mode === "grid");
  }, [mode]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== parent) return;
      if (event.data?.type === "vibe-preview-state") setMode(event.data.value);
      if (event.data?.type === "vibe-preview-platform")
        setPlatform(event.data.value);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  const open = (index: number) => {
      album.select(index);
      setViewer(index);
    },
    change = (step: -1 | 1) => {
      if (viewer === null) return;
      const next = (viewer + step + photos.length) % photos.length;
      album.select(next);
      setViewer(next);
    };
  return {
    mode,
    platform,
    photos,
    album,
    upload,
    uploading,
    setUploading,
    chooseUpload: () => {
      upload.begin();
      setUploading(true);
    },
    viewer,
    open,
    change,
    closeViewer: () => setViewer(null),
    download,
    recovered,
    retry: () => {
      setRecovered(true);
      setPhotos((previous) => (previous.length ? previous : initialPhotos));
    },
    denied: mode === "denied",
  };
};
