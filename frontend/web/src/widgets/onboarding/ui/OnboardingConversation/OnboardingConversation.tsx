import { Avatar } from '@/shared/ui/Avatar';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import styles from '@/widgets/onboarding/ui/OnboardingConversation/OnboardingConversation.module.css';

export const OnboardingConversation = () => (
  <div className={styles.chat} inert>
    <div className={styles.row}>
      <Avatar name="Лена" size="mobile-chat" />
      <div className={styles.message}>
        <div className={styles.metadata}>Лена · 18:42</div>
        <img src="/onboarding/dinner.png" alt="" />
        <span className={styles.reaction}>👍 3</span>
      </div>
    </div>
    <div className={styles.row} data-own="true">
      <div className={styles.message}>
        <div className={styles.file}>
          <ChatIcon name="file" />
          <span>
            Правила игры.pdf<small>2,3 МБ</small>
          </span>
        </div>
        <div className={styles.metadata}>
          18:43 <span aria-label="Прочитали 4">✓✓</span>
        </div>
      </div>
    </div>
  </div>
);
