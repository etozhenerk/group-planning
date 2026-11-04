import { designTokens } from '@/shared/config/design-tokens';
import { useMobileLayout } from '@/shared/lib/media';
import { Status } from '@/shared/ui/Status';
import { Link } from 'react-router';
import { Mail } from 'lucide-react';
import styles from '@/pages/invitations/ui/InvitationEmpty/InvitationEmpty.module.css';

export const InvitationEmpty = () => {
  const mobile = useMobileLayout();

  if (mobile) {
    return (
      <Status
        title="Приглашений пока нет"
        variant="panel"
        actionLabel="К моим встречам"
        actionTo="/meetings"
        icon={
          <Mail
            size={Number.parseFloat(designTokens.componentMobileStateGlyphSize)}
            strokeWidth={designTokens.componentMobileStateGlyphStroke}
            aria-hidden="true"
          />
        }
      />
    );
  }

  return (
    <div className={styles.empty}>
      <Mail size={21} />
      <h2>Пока ничего нет</h2>
      <Link to="/meetings">К моим встречам</Link>
    </div>
  );
};
