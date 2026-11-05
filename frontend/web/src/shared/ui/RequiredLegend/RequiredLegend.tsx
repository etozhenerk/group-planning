import { useMobileLayout } from '@/shared/lib/media';
import { RequiredMark } from '@/shared/ui/RequiredMark';
import styles from '@/shared/ui/RequiredLegend/RequiredLegend.module.css';

export type RequiredLegendProps = { spaced?: boolean; sentence?: boolean };

export const RequiredLegend = ({
  spaced = false,
  sentence = false,
}: RequiredLegendProps) => {
  const mobile = useMobileLayout();

  return mobile ? (
    <p className={styles.legend} data-spaced={spaced}>
      <RequiredMark /> {sentence ? '— обязательные поля' : 'Обязательные поля'}
    </p>
  ) : null;
};
