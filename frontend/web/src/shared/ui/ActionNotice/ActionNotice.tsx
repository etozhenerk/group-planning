import { TriangleAlert } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/shared/ui/ActionNotice/ActionNotice.module.css';

export type ActionNoticeProps = { title: string; text: string; id?: string };

export const ActionNotice = ({ title, text, id }: ActionNoticeProps) => (
  <div id={id} className={styles.notice} role="alert">
    <span className={styles.icon} aria-hidden="true">
      <TriangleAlert
        size={designTokens.componentInvitationNoticeGlyphSize}
        strokeWidth={designTokens.componentIconStrokeWidth}
      />
    </span>
    <div className={styles.copy}>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  </div>
);
