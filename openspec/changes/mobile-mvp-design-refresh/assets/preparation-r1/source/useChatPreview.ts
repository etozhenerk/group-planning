import { useEffect, useRef, useState } from "react";
import type {
  PreparationAction,
  PreparationTaskCreate,
} from "@/entities/meeting";
import { useChatPreview as useChatBase } from "@preview/useChatBase";
import { meeting, message, user, baseEntries } from "@preview/data";
import { taskFor, rights, taskPeople } from "@preview/taskFixtures";
import { formModes } from "@preview/pollFixtures";
export const useChatPreview = () => {
  const base = useChatBase(),
    [task, setTask] = useState(() => taskFor(base.scenario)),
    [show, setShow] = useState(!formModes.has(base.scenario)),
    [formGuard, setFormGuard] = useState(false),
    [recipientOpen, setRecipientOpen] = useState(base.scenario === "recipient"),
    [pendingTask, setPendingTask] = useState<PreparationAction | undefined>(),
    [taskProblem, setTaskProblem] = useState(""),
    [taskUncertain, setTaskUncertain] = useState(false),
    [lastTaskAction, setLastTaskAction] = useState<PreparationAction>("accept");
  const lock = useRef(false),
    timer = useRef<number | undefined>(),
    failed = useRef(false);
  useEffect(() => {
    window.clearTimeout(timer.current);
    lock.current = false;
    failed.current = false;
    setTask(taskFor(base.scenario));
    setShow(!formModes.has(base.scenario));
    setFormGuard(false);
    setRecipientOpen(base.scenario === "recipient");
    setPendingTask(undefined);
    setTaskProblem("");
    setTaskUncertain(false);
  }, [base.scenario]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const actTask = (action: PreparationAction, complete?: () => void) => {
    if (lock.current) return;
    const allowed = {
      accept: task.canAccept,
      complete: task.canComplete,
      decline: task.canDecline,
      cancel: task.canCancel,
    };
    if (!allowed[action]) return;
    lock.current = true;
    setPendingTask(action);
    setLastTaskAction(action);
    setTaskProblem("");
    timer.current = window.setTimeout(() => {
      lock.current = false;
      setPendingTask(undefined);
      if (
        ["action-error", "conflict"].includes(base.scenario) &&
        !failed.current
      ) {
        failed.current = true;
        if (base.scenario === "conflict") {
          setTask((previous) =>
            rights({
              ...previous,
              state: "accepted",
              assignee: taskPeople[2],
              updatedBy: taskPeople[2],
              revision: "2",
            }),
          );
          setTaskProblem("Задача изменилась. Проверьте её состояние.");
        } else {
          setTaskProblem(
            "Не удалось подтвердить действие. Повторите отправку.",
          );
          setTaskUncertain(true);
        }
        return;
      }
      setTaskUncertain(false);
      setTaskProblem("");
      setTask((previous) =>
        rights({
          ...previous,
          state:
            action === "accept"
              ? "accepted"
              : action === "complete"
                ? "completed"
                : action === "decline"
                  ? "declined"
                  : "cancelled",
          assignee: action === "accept" ? taskPeople[1] : previous.assignee,
          updatedBy: taskPeople[1],
          revision: String(Number(previous.revision) + 1),
        }),
      );
      complete?.();
    }, 400);
  };
  const addTask = (input: PreparationTaskCreate) => {
    setTask(
      rights({
        ...taskFor("offered"),
        title: input.title,
        author: taskPeople[1],
        updatedBy: taskPeople[1],
        recipient:
          taskPeople.find((person) => person.id === input.recipientId) ?? null,
        assignee: null,
      }),
    );
    setShow(true);
  };
  const stateCopy = {
    accepted: "принята",
    completed: "выполнена",
    declined: "отклонена",
    cancelled: "отменена",
  };
  const entries = [
    ...baseEntries.slice(0, 3),
    message(
      "task-chat",
      "lena",
      "Ребят, давайте после ужина во что-нибудь сыграем?",
      14,
    ),
    ...(show
      ? [
          {
            ...message("task-preview", task.author.id, "", 16),
            text: null,
            taskId: task.id,
          },
        ]
      : []),
    ...(show && task.state !== "offered"
      ? [
          {
            ...message("task-event", task.updatedBy.id, "", 18),
            kind: "event",
            text: null,
            event:
              "Задача «" +
              task.title +
              "» " +
              stateCopy[task.state] +
              " · " +
              task.updatedBy.displayName +
              ".",
          },
        ]
      : []),
  ];
  return {
    ...base,
    tasks: { [task.id]: task },
    task,
    entries,
    details: meeting,
    session: user,
    mapOpen: false,
    formGuard,
    setFormGuard,
    recipientOpen,
    setRecipientOpen,
    pendingTask,
    taskProblem,
    taskUncertain,
    lastTaskAction,
    actTask,
    addTask,
  };
};
