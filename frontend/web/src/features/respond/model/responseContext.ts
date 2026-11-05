import { createContext } from 'react';
import type { useResponseController } from '@/features/respond/model/useResponseController';

export const responseContext = createContext<ReturnType<
  typeof useResponseController
> | null>(null);
