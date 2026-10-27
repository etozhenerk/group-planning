import { type Context } from "@prototype/pages/chat/model/context";
import { person } from "@prototype/pages/chat/model/model";

export const handleTaskAction = (context: Context, action: string): boolean => {
  const { state } = context;
  const task = state.task;

  if (
    action === "task-accept" &&
    task.status === "proposed" &&
    (task.recipient === "any" || task.recipient === state.user)
  ) {
    task.status = "accepted";
    task.assignee = state.user;
    state.systems.push(
      `Задачу «${task.title}» теперь исполняет ${person(state.user).name}.`,
    );
  } else if (
    action === "task-complete" &&
    task.status === "accepted" &&
    task.assignee === state.user
  ) {
    task.status = "done";
    state.systems.push(
      `Задача «${task.title}» выполнена · ${person(state.user).name}.`,
    );
  } else if (action === "task-decline" || action === "task-cancel") {
    state.pendingTaskAction = action === "task-cancel" ? "cancel" : "decline";
    state.sheet = "confirm-task";
    context.redrawSheet();

    return true;
  } else if (action === "confirm-task") {
    task.status =
      state.pendingTaskAction === "cancel" ? "cancelled" : "declined";
    task.assignee = null;
    state.systems.push(
      `Задача «${task.title}»: ${state.pendingTaskAction === "cancel" ? "отмена" : "отказ"} · ${person(state.user).name}.`,
    );
    state.sheet = "task";
  } else if (action === "return-task") {
    state.sheet = "task";
    context.redrawSheet();

    return true;
  } else {
    return false;
  }

  context.redrawConversation();

  if (state.sheet) {
    context.redrawSheet();
  }

  context.announce("Состояние задачи обновлено в макете");

  return true;
};
