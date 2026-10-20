import { useState } from 'react';

export const useExample = () => {
  const [after, setAfter] = useState(false);

  return { after, before: () => setAfter(false), next: () => setAfter(true) };
};
