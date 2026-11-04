import { useRef } from "react";
export const useAboutPreview = () => {
  const params = new URLSearchParams(location.search),
    mode = params.get("state") ?? "release",
    platform = params.get("platform") ?? "web";
  const positions = useRef<Record<string, number>>({});
  return { mode, platform, positions };
};
export type AboutModel = ReturnType<typeof useAboutPreview>;
