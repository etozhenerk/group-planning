import { designTokens } from '@/shared/config/design-tokens';

export const BackIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={Number.parseFloat(designTokens.componentMobileBackIconSize)}
    height={Number.parseFloat(designTokens.componentMobileBackIconSize)}
    fill="none"
    stroke="currentColor"
    strokeWidth={designTokens.componentMobileBackStrokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 5-7 7 7 7" />
  </svg>
);
