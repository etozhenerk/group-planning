import { useState } from 'react';

export const useDisclosure = () => {
  const [open, setOpen] = useState(false);

  return { open, show: () => setOpen(true), close: () => setOpen(false) };
};
