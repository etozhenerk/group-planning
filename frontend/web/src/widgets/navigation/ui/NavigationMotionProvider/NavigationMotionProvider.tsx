import { useRef, type ReactNode } from 'react';
import { navigationMotion } from '@/widgets/navigation/model/motionContext';

export type NavigationMotionProviderProps = { children: ReactNode };

export const NavigationMotionProvider = ({ children }: NavigationMotionProviderProps) => {
  const position = useRef<number | null>(null);

  return (
    <navigationMotion.Provider value={position}>{children}</navigationMotion.Provider>
  );
};
