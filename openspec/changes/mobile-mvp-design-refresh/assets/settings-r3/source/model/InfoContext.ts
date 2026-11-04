import { createContext, useContext } from 'react';
import type { useInfoPreview } from '@preview/model/useInfoPreview';
export const InfoContext = createContext<ReturnType<typeof useInfoPreview> | null>(null);
export const useInfoModel = () => {
  const value = useContext(InfoContext);
  if (!value) {
    throw new Error('Info context missing');
  }
  return value;
};
