import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useChatModel } from "@preview/ChatContext";
import { taskPeople } from "@preview/taskFixtures";
export const useTaskForm = (
  _meeting: string,
  _session: unknown,
  done: () => void,
) => {
  const m = useChatModel(),
    [title, setTitle] = useState(
      ["validation", "empty-form"].includes(m.scenario)
        ? ""
        : "Принести настолки",
    ),
    [recipient, setRecipient] = useState(
      ["validation", "empty-form"].includes(m.scenario) ? "" : "sasha",
    ),
    [fieldError, setFieldError] = useState(
      m.scenario === "validation" ? "Напишите, что нужно сделать" : "",
    ),
    [peopleState, setPeopleState] = useState(
      m.scenario === "people-error"
        ? "error"
        : m.scenario === "people-loading"
          ? "loading"
          : "ready",
    ),
    [problem, setProblem] = useState(
      m.scenario === "form-error"
        ? "error"
        : m.scenario === "uncertain"
          ? "uncertain"
          : "",
    ),
    [pending, setPending] = useState(false);
  const initial = useRef(JSON.stringify({ title, recipient })),
    timer = useRef<number | undefined>(),
    lock = useRef(false),
    uncertain = problem === "uncertain",
    locked = pending || uncertain,
    dirty = initial.current !== JSON.stringify({ title, recipient });
  const edit = (change: () => void) => {
    if (locked) return;
    change();
    setProblem("");
    setFieldError("");
  };
  useEffect(() => {
    const close = () => {
      if (locked) return;
      if (m.recipientOpen) m.setRecipientOpen(false);
      else if (m.formGuard) m.setFormGuard(false);
      else if (dirty) m.setFormGuard(true);
      else done();
    };
    window.addEventListener("task-form-close", close);
    return () => window.removeEventListener("task-form-close", close);
  }, [dirty, locked, m.recipientOpen, m.formGuard]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (lock.current || peopleState !== "ready") return;
    const trimmed = title.trim();
    if (!trimmed) {
      setFieldError("Напишите, что нужно сделать");
      return;
    }
    if ([...trimmed].length > 200) {
      setFieldError("Сократите название до 200 символов");
      return;
    }
    if (recipient && !taskPeople.some((person) => person.id === recipient)) {
      setFieldError("Выберите участника из списка");
      return;
    }
    lock.current = true;
    setPending(true);
    setProblem("");
    timer.current = window.setTimeout(() => {
      lock.current = false;
      setPending(false);
      m.addTask({ title: trimmed, recipientId: recipient || null });
      done();
    }, 400);
  };
  return {
    title,
    recipient,
    fieldError,
    problem,
    pending,
    uncertain,
    locked,
    peopleState,
    people: taskPeople,
    setTitle: (value: string) => edit(() => setTitle(value)),
    choose: (value: string) =>
      edit(() => {
        setRecipient(value);
        m.setRecipientOpen(false);
      }),
    submit,
    retryPeople: () => setPeopleState("ready"),
    stay: () => m.setFormGuard(false),
    leave: () => {
      m.setFormGuard(false);
      done();
    },
  };
};
