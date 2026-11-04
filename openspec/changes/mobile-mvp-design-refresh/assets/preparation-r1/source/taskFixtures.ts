import type { PreparationTask, TaskPerson } from "@/entities/meeting";
import { taskSeed } from "@preview/data";
import { portraitForName } from "@preview/portraits";
export const taskPeople: TaskPerson[] = [
  { id: "lena", displayName: "Лена" },
  { id: "misha", displayName: "Миша" },
  { id: "sasha", displayName: "Саша" },
  { id: "dima", displayName: "Дима" },
  { id: "anya", displayName: "Аня" },
  { id: "olya", displayName: "Оля" },
].map((person) => ({
  ...person,
  avatarUrl: portraitForName(person.displayName),
}));
export const rights = (
  task: PreparationTask,
  user = "misha",
): PreparationTask => ({
  ...task,
  canAccept:
    task.state === "offered" && (!task.recipient || task.recipient.id === user),
  canDecline:
    task.state === "offered"
      ? task.recipient?.id === user
      : task.state === "accepted" && task.assignee?.id === user,
  canComplete: task.state === "accepted" && task.assignee?.id === user,
  canCancel:
    ["offered", "accepted"].includes(task.state) &&
    (task.author.id === user || user === "lena"),
});
export const taskFor = (mode: string): PreparationTask => {
  const state = ["accepted", "accepted-other"].includes(mode)
    ? "accepted"
    : ["completed", "declined", "cancelled"].includes(mode)
      ? mode
      : "offered";
  const author =
    mode === "author" || mode === "self" ? taskPeople[1] : taskPeople[0];
  const recipient =
    mode === "to-me" || mode === "self"
      ? taskPeople[1]
      : mode === "to-other" || mode === "author"
        ? taskPeople[2]
        : null;
  const assignee =
    state === "accepted" || state === "completed"
      ? taskPeople[mode === "accepted-other" ? 2 : 1]
      : null;
  return rights({
    ...taskSeed,
    createdAt: "2026-11-04T06:16:00Z",
    title:
      mode === "long"
        ? "Принести две настольные игры, которые подойдут для компании из шести человек, и проверить, что все карточки и фишки на месте"
        : "Принести настолки",
    state,
    author,
    recipient,
    assignee,
    updatedBy: state === "offered" || state === "cancelled" ? author : assignee ?? taskPeople[1],
  });
};
