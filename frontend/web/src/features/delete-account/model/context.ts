import { createContext, useContext } from 'react';

export const DeletionContext = createContext<(csrf: string | null) => void>(
  () => undefined,
);

export const useOpenDeletion = () => useContext(DeletionContext);
