import { designTokens } from '@/shared/config/design-tokens';
import { chatIconPaths } from '@/shared/ui/ChatIcon/lib/chatIconPaths';
import type { ChatIconName } from '@/shared/ui/ChatIcon/lib/chatIconPaths';
import styles from '@/shared/ui/ChatIcon/ChatIcon.module.css';

export type ChatIconProps = {
  name: ChatIconName;
  size?: number | string;
  className?: string | undefined;
};

export const ChatIcon = ({
  name,
  size = designTokens.componentMobileChatIconSize,
  className,
}: ChatIconProps) => (
  <svg
    className={[styles.icon, className].filter(Boolean).join(' ')}
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: chatIconPaths[name] }}
  />
);
