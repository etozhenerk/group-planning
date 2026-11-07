export const layoutTop = (element: HTMLElement): number => {
  let top = 0;
  let node: HTMLElement | null = element;

  while (node) {
    top += node.offsetTop;
    node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
  }

  return top;
};
