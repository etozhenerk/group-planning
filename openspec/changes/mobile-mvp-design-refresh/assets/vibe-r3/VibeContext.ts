import {createContext,useContext} from 'react';
import type {useVibe} from '@preview/useVibe';
export const VibeContext=createContext<ReturnType<typeof useVibe>|null>(null);
export const useVibeModel=()=>{const value=useContext(VibeContext);if(!value)throw new Error('Vibe context');return value};
