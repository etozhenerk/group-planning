export type GroupableMessage = {
  id: string;
  kind: string;
  actor: { id: string };
  occurredAt: string;
  delivery?: string;
  pollId?: string;
  placePollId?: string;
  taskId?: string;
};

const canAttach = (
  previous: GroupableMessage | undefined,
  current: GroupableMessage | undefined,
  breakBefore?: string,
) => {
  if (!previous || !current || current.id === breakBefore) {
    return false;
  }
  const gap = Date.parse(current.occurredAt) - Date.parse(previous.occurredAt);
  return (
    previous.kind === "message" &&
    current.kind === "message" &&
    previous.actor.id === current.actor.id &&
    !previous.delivery &&
    !current.delivery &&
    !previous.pollId &&
    !current.pollId &&
    !previous.placePollId &&
    !current.placePollId &&
    !previous.taskId &&
    !current.taskId &&
    Number.isFinite(gap) &&
    gap >= 0 &&
    gap <= 300000
  );
};

export const getMessageGrouping = (
  entries: readonly GroupableMessage[],
  id: string,
  breakBefore?: string,
) => {
  const index = entries.findIndex((entry) => entry.id === id);
  if (index < 0) {
    return { start: true, end: true };
  }
  return {
    start: !canAttach(entries[index - 1], entries[index], breakBefore),
    end: !canAttach(entries[index], entries[index + 1], breakBefore),
  };
};
