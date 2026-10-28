import { createContext, type RefObject } from 'react';

export const navigationMotion = createContext<RefObject<number | null> | null>(null);
