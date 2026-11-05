import { useState } from 'react';
import { DropdownMenu } from '@gravity-ui/uikit';
import { LogOut } from 'lucide-react';
import type { Session } from '@/entities/session';
import { Avatar } from '@/shared/ui/Avatar';
import { errorText } from '@/shared/api';
import { designTokens } from '@/shared/config/design-tokens';
import { useLogout } from '@/features/sign-in/model/useLogout';
import styles from '@/features/sign-in/ui/AccountMenu/AccountMenu.module.css';

export type AccountMenuProps = { session: Session };

export const AccountMenu = ({ session }: AccountMenuProps) => {
  const [open, setOpen] = useState(false);
  const action = useLogout(session);

  return (
    <div className={styles.root}>
      <DropdownMenu
        open={open}
        onOpenToggle={setOpen}
        disabled={action.isPending}
        menuProps={{ className: styles.menu ?? '', 'aria-label': 'Аккаунт' }}
        popupProps={{ placement: 'bottom-end' }}
        items={[
          { text: session.user.displayName, disabled: true, action: () => {} },
          {
            text: 'Выйти',
            action: () => action.mutate(),
            iconStart: (
              <LogOut
                size={designTokens.spaceS16}
                strokeWidth={designTokens.componentIconStrokeWidth}
              />
            ),
            disabled: action.isPending,
          },
        ]}
        renderSwitcher={(props) => (
          <button
            {...props}
            className={styles.avatar}
            type="button"
            aria-label={`Аккаунт: ${session.user.displayName}`}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-busy={action.isPending}
            disabled={action.isPending}
          >
            <Avatar
              name={session.user.displayName}
              src={session.user.avatarUrl ?? null}
              size="small"
              silhouette
            />
          </button>
        )}
      />
      {action.error && (
        <p className={styles.error} role="alert">
          {errorText(action.error)}
        </p>
      )}
    </div>
  );
};
