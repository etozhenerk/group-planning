import { designTokens } from '@/shared/config/design-tokens';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import styles from '@/widgets/meeting-details/ui/InformationFailure/InformationFailure.module.css';

export type InformationFailureProps = { retry: () => void };

export const InformationFailure = ({ retry }: InformationFailureProps) => (
  <section className={styles.state} role="alert">
    <span className={styles.mark}>
      <ChatIcon
        name="calendar"
        size={Number.parseFloat(designTokens.componentMobileInfoErrorGlyphSize)}
      />
    </span>
    <h2>Встреча не загрузилась</h2>
    <p>Не удалось получить детали встречи. Попробуйте ещё раз.</p>
    <button type="button" onClick={retry}>
      Повторить загрузку
      <ChatIcon
        name="right"
        size={Number.parseFloat(designTokens.componentMobileStateRefreshActionGlyphSize)}
      />
    </button>
  </section>
);
