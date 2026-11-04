export const dateInputDescription = (id: string, required: boolean, error: string) =>
  [required ? `${id}-required` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ');
