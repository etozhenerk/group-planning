import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { designTokens } from '@/shared/config/design-tokens';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/widgets/invitation/ui/InvitationReturn/InvitationReturn.module.css';

export type InvitationReturnProps = { signedIn: boolean };

export const InvitationReturn = ({ signedIn }: InvitationReturnProps) => {
  const mobile = useMobileLayout();

  return (
    <Link
      className={styles.return}
      data-mobile={mobile}
      to={signedIn ? '/invitations' : '/'}
    >
      <ArrowLeft
        size={designTokens.componentMobileInvitationReturnIconSize}
        aria-hidden="true"
      />
      {signedIn ? 'К приглашениям' : 'О somewhere'}
    </Link>
  );
};
