import type { CSSProperties } from 'react';
import { designTokens } from '@/shared/config/design-tokens';
import type { useAlbum } from '@/pages/memories/model/useAlbum';

export const albumPhotoStyle = (
  album: ReturnType<typeof useAlbum>,
  depth: number,
): CSSProperties =>
  ({
    '--depth': depth,
    '--dy': `${depth === 0 ? album.vertical : 0}px`,
    '--angle': `${depth === 0 ? Number(designTokens.componentMobileVibeStackInitialAngle) + Math.max(-Number(designTokens.componentMobileVibeDragAngleMaximum), Math.min(Number(designTokens.componentMobileVibeDragAngleMaximum), album.offset / Number(designTokens.componentMobileVibeDragAngleDivisor))) : depth * Number(designTokens.componentMobileVibeStackAngleStep) + Number(designTokens.componentMobileVibeStackInitialAngle) - album.progress * Number(designTokens.componentMobileVibeStackAngleStep)}deg`,
    '--drag': `${depth === 0 ? album.offset : 0}px`,
    '--tilt': `${depth === 0 ? album.offset / 35 : 0}deg`,
  }) as CSSProperties;
