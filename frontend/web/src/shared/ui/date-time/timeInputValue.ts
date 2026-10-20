export const timeInputValue = (value: string): string => {
  return /^\d{3,4}$/.test(value) ? `${value.slice(0, 2)}:${value.slice(2)}` : value;
};
