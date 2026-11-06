import { useLocation } from 'react-router';
import { readReturnLocation } from '@/shared/lib/navigation';
import { Link } from 'react-router';
import type { useFeedback } from '@/features/support-feedback/model/useFeedback';
import styles from '@/features/support-feedback/ui/MobileFeedbackOptions/MobileFeedbackOptions.module.css';

export type MobileFeedbackOptionsProps = { model: ReturnType<typeof useFeedback> };

export const MobileFeedbackOptions = ({ model: m }: MobileFeedbackOptionsProps) => {
  const location = useLocation();

  return (
    <div className={styles.options}>
      <label className={styles.row}>
        <span>
          <strong>Данные об устройстве</strong>
          <small>Версия приложения, браузер и размер экрана</small>
        </span>
        <span className={styles.switch}>
          <input
            type="checkbox"
            checked={m.diagnostics}
            onChange={(e) => m.setDiagnostics(e.target.checked)}
          />
          <i aria-hidden="true" />
        </span>
      </label>
      <Link
        to="/privacy"
        state={{
          returnTo: location.pathname + location.search,
          returnState: { returnTo: readReturnLocation(location.state, '/help').path },
        }}
      >
        Политика конфиденциальности
      </Link>
    </div>
  );
};
