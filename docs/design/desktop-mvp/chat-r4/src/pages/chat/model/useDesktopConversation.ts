import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useConversationSurface } from "@/widgets/conversation/model/useConversationSurface";
import { useChatModel } from "@preview/ChatContext";
import { meeting, user } from "@preview/data";

export const useDesktopConversation = () => {
  const model = useChatModel();
  const surface = useConversationSurface(meeting.id, user.user.id);
  const [dialog, setDialog] = useState<string | null>(null);
  const [dockHeight, setDockHeight] = useState(80);
  const feed = useRef<HTMLDivElement>(null),
    dock = useRef<HTMLDivElement>(null),
    nearBottom = useRef(true);
  useEffect(() => {
    const reset = () => {
      setDialog(null);
      surface.setPanel(null);
      nearBottom.current = true;
    };
    window.addEventListener("chat-close-surfaces", reset);
    return () => window.removeEventListener("chat-close-surfaces", reset);
  }, []);
  useLayoutEffect(() => {
    if (!dock.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setDockHeight(
        entry?.borderBoxSize[0]?.blockSize ?? entry?.contentRect.height ?? 80,
      ),
    );
    observer.observe(dock.current);
    return () => observer.disconnect();
  }, [model.scenario]);
  useLayoutEffect(() => {
    if (nearBottom.current && feed.current)
      feed.current.scrollTop = feed.current.scrollHeight;
  }, [model.entries, dockHeight, model.scenario]);
  const onScroll = () => {
    const el = feed.current!;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (nearBottom.current) model.setIncoming(0);
  };
  const jump = () => {
    nearBottom.current = true;
    feed.current?.scrollTo({
      top: feed.current.scrollHeight,
      behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
        ? "auto"
        : "smooth",
    });
    model.setIncoming(0);
  };
  return {
    model,
    surface,
    dialog,
    setDialog,
    feed,
    dock,
    dockHeight,
    onScroll,
    jump,
    unavailable: ["denied", "error", "loading"].includes(model.scenario),
  };
};
