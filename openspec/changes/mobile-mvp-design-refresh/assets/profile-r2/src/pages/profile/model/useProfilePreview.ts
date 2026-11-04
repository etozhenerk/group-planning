import { useEffect, useRef, useState } from "react";
export const useProfilePreview = () => {
  const [mode, setMode] = useState(
    new URLSearchParams(location.search).get("state") ?? "ready",
  );
  const [open, setOpen] = useState(mode === "personal"),
    [busy, setBusy] = useState(false),
    [logoutError, setLogoutError] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null),
    timer = useRef<number | undefined>(undefined);
  const name = mode === "long" ? "Александр Константинопольский" : "Михаил Иванов";
  const missing = mode === "missing";
  const profile = {
    name,
    avatar: missing ? null : "./avatars/misha.jpg",
    login: missing ? null : "misha",
    first_name: missing ? null : "Михаил",
    last_name: missing ? null : "Иванов",
    birthday: missing ? "0000-12-23" : "1996-12-23",
    sex: missing ? null : "male",
    email: missing
      ? null
      : mode === "long"
        ? "alexander.konstantinopolskiy@example.com"
        : "misha@example.com",
    phone: null,
  };
  const signOut = () => {
    setBusy(true);
    setLogoutError(false);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      if (mode === "logout-error") setLogoutError(true);
      else setMode("signedout");
    }, 650);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    mode,
    setMode,
    profile,
    open,
    setOpen,
    trigger,
    busy,
    logoutError,
    signOut,
  };
};
export type ProfileModel = ReturnType<typeof useProfilePreview>;
