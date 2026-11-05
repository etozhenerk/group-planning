import type { ReactNode } from 'react';
import { responseContext } from '@/features/respond/model/responseContext';
import { useResponseController } from '@/features/respond/model/useResponseController';

export type ResponseProviderProps = { children: ReactNode };

export const ResponseProvider = ({ children }: ResponseProviderProps) => {
  const controller = useResponseController();

  return (
    <responseContext.Provider value={controller}>{children}</responseContext.Provider>
  );
};
