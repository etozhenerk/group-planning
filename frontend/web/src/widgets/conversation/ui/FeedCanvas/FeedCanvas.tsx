import type { ReactNode } from 'react';
import type { ConversationSurface } from '@/widgets/conversation/model/useConversationSurface';
import styles from '@/widgets/conversation/ui/FeedCanvas/FeedCanvas.module.css';

export type FeedCanvasProps = { surface: ConversationSurface; children: ReactNode };

export const FeedCanvas = ({ surface, children }: FeedCanvasProps) => (
  <div className={styles.canvas}>
    {children}
    {surface.mobile && surface.panel?.startsWith('reaction:') && (
      <button
        type="button"
        className={styles.dim}
        tabIndex={-1}
        aria-label="Закрыть действия с сообщением"
        onClick={() => surface.setPanel(null)}
      />
    )}
  </div>
);
