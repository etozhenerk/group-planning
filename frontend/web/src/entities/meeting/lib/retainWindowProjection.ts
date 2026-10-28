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
