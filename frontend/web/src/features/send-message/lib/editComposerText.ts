export type ComposerSelection = { start: number; end: number };

const boundedSelection = (text: string, selection: ComposerSelection) => ({
  start: Math.max(0, Math.min(selection.start, text.length)),
  end: Math.max(0, Math.min(selection.end, text.length)),
});

export const insertComposerText = (
  text: string,
  selection: ComposerSelection,
  insertion: string,
) => {
  const { start, end } = boundedSelection(text, selection);
  const next = text.slice(0, start) + insertion + text.slice(end);

  if (next.length > 4000) {
    return null;
  }

  const cursor = start + insertion.length;

  return { text: next, selection: { start: cursor, end: cursor } };
};

export const eraseComposerText = (text: string, selection: ComposerSelection) => {
  const { start, end } = boundedSelection(text, selection);
  let previous = start;

  if (start === end && start > 0) {
    const segments = new Intl.Segmenter('ru', { granularity: 'grapheme' }).segment(text);

    for (const segment of segments) {
      if (segment.index >= start) {
        break;
      }

      previous = segment.index;
    }
  }

  return {
    text: text.slice(0, previous) + text.slice(end),
    selection: { start: previous, end: previous },
  };
};
