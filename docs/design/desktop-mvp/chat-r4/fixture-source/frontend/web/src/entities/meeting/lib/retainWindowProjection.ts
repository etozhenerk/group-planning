export const retainWindowProjection = <T extends { entry_id: string }>(
  scope: readonly unknown[],
  entries: readonly string[],
  previous: T[] | undefined,
  previousKey: readonly unknown[] | undefined,
  denied: boolean,
) => {
  if (
    denied ||
    !previousKey ||
    !scope.every((value, index) => previousKey[index] === value)
  ) {
    return undefined;
  }

  const visible = new Set(entries);

  return previous?.filter((entry) => visible.has(entry.entry_id));
};

export type WindowProjectionSnapshot<T extends { entry_id: string }> = {
  scope: readonly unknown[];
  data: T[];
};

export const selectWindowProjection = <T extends { entry_id: string }>(
  scope: readonly unknown[],
  entries: readonly string[],
  query: { data: T[] | undefined; isSuccess: boolean; isPlaceholderData: boolean },
  previous: WindowProjectionSnapshot<T> | undefined,
  denied: boolean,
) => {
  if (denied) {
    return { data: undefined, snapshot: undefined };
  }

  const retained = retainWindowProjection(
    scope,
    entries,
    previous?.data,
    previous?.scope,
    false,
  );

  const snapshot =
    query.isSuccess && !query.isPlaceholderData && query.data
      ? {
          scope: [...scope],
          data: [
            ...new Map(
              query.data
                .filter((entry) => entries.includes(entry.entry_id))
                .map((entry) => [entry.entry_id, entry]),
            ).values(),
          ],
        }
      : retained === undefined
        ? undefined
        : previous;

  return { data: query.data ?? retained, snapshot };
};
