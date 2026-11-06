import { useRef, useState } from 'react';
import { LockKeyhole, ChevronDown } from 'lucide-react';
import type { ProfileRecord } from '@/pages/profile/model/profileRecord';
import { ProfileAccountData } from '@/pages/profile/ui/ProfileAccountData';
import { Avatar } from '@/shared/ui/Avatar';
import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/pages/profile/ui/MobileProfileAccount/MobileProfileAccount.module.css';

export type MobileProfileAccountProps = { profile: ProfileRecord };

export const MobileProfileAccount = ({ profile }: MobileProfileAccountProps) => {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <section className={styles.identity} aria-label="Ваш профиль">
        <Avatar name={profile.display_name} src={profile.avatar_url} size="profile" />
        <div>
          <h2>{profile.display_name}</h2>
          <p>Вход через Яндекс ID</p>
        </div>
      </section>
      <button
        type="button"
        className={styles.access}
        ref={trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <LockKeyhole size={designTokens.componentMobileProfileMenuIcon} />
        <span>
          <strong>Данные аккаунта</strong>
          <small>Личные данные и контакты · только вам</small>
        </span>
        <ChevronDown size={designTokens.componentMobileFieldIconSize} />
      </button>
      <ProfileAccountData
        profile={profile}
        open={open}
        close={() => setOpen(false)}
        trigger={trigger}
      />
    </>
  );
};
