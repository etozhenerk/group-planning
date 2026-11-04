import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type {
  Draft,
  Errors,
} from "@future/features/create-meeting/model/types";
import {
  blank,
  filled,
  readDraft,
  validate,
} from "@future/features/create-meeting/model/draft";

export const useCreation = () => {
  const initial = new URLSearchParams(location.search).get("state") ?? "empty";
  const [scenario, setScenario] = useState(initial);
  const [value, setValue] = useState<Draft>(() =>
    initial === "validation"
      ? { ...blank }
      : initial === "empty"
        ? readDraft()
        : { ...filled },
  );
  const [errors, setErrors] = useState<Errors>(
    initial === "validation" ? validate(blank) : {},
  );
  const [problem, setProblem] = useState(
    ["error", "uncertain"].includes(initial) ? initial : "",
  );
  const [pending, setPending] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [created, setCreated] = useState(initial === "success");
  const [destination, setDestination] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempted = useRef(false);
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );
  useEffect(() => {
    if (created) {
      location.href = "../desktop-chat-r4/preview.html";
    }
  }, [created]);
  useEffect(() => {
    if (!created) {
      try {
        sessionStorage.setItem("desktop-create-draft", JSON.stringify(value));
      } catch {
        /* Storage capacity is browser-dependent in the isolated demo. */
      }
    }
  }, [value, created]);
  const change = (next: Draft) => {
    if (pending || problem === "uncertain") {
      return;
    }
    setValue(next);
    setProblem("");
    setErrors((previous) =>
      Object.fromEntries(
        Object.entries(validate(next)).filter(([key]) => key in previous),
      ),
    );
  };
  const changeState = (state: string) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setScenario(state);
    setValue(
      state === "empty" || state === "validation"
        ? { ...blank }
        : { ...filled },
    );
    setErrors(state === "validation" ? validate(blank) : {});
    setProblem(["error", "uncertain"].includes(state) ? state : "");
    setPending(false);
    setPreparing(false);
    setCreated(state === "success");
    setDestination("");
    attempted.current = false;
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || preparing) {
      return;
    }
    const nextErrors = validate(value);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    setPending(true);
    timer.current = setTimeout(() => {
      setPending(false);
      if (
        ["error", "uncertain"].includes(scenario) &&
        !attempted.current &&
        !problem
      ) {
        attempted.current = true;
        setProblem(scenario);
        return;
      }
      setCreated(true);
      setProblem("");
      sessionStorage.removeItem("desktop-create-draft");
    }, 900);
  };
  const navigate = (to: string) => {
    if (pending) {
      return;
    }
    if (!created && Object.values(value).some(Boolean)) {
      setDestination(to);
    } else {
      location.href = to;
    }
  };
  return {
    scenario,
    value,
    change,
    errors,
    problem,
    pending,
    preparing,
    setPreparing,
    locked: pending || preparing || problem === "uncertain",
    created,
    submit,
    formRef,
    changeState,
    navigate,
    destination,
    stay: () => setDestination(""),
    leave: () => {
      location.href = destination;
    },
  };
};
