import type { RefObject } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Dialog } from '@/shared/ui/Dialog';
import { designTokens } from '@/shared/config/design-tokens';
import { birthdayLabel, sexLabel } from '@/pages/profile/lib/personalLabels';
import type { ProfileRecord } from '@/pages/profile/model/profileRecord';
import { ProfileAccountRow } from '@/pages/profile/ui/ProfileAccountRow';
import styles from '@/pages/profile/ui/ProfileAccountData/ProfileAccountData.module.css';

export type ProfileAccountDataProps = {
  profile: ProfileRecord;
  open: boolean;
  close: () => void;
  trigger: RefObject<HTMLElement | null>;
};

export const ProfileAccountData = ({
  profile,
  open,
  close,
  trigger,
}: ProfileAccountDataProps) => (
  <Dialog
    open={open}
    title="Данные аккаунта"
    onClose={close}
    returnFocus={trigger}
    chatAction
  >
    <div className={styles.data}>
      <p className={styles.privacy}>
        <LockKeyhole size={designTokens.spaceS16} />
        Эти данные видны только вам
      </p>
      <p className={styles.source}>Получены из Яндекс ID</p>
      <h3>Контакты</h3>
      <dl>
        <ProfileAccountRow label="Почта" value={profile.email ?? 'Не указана'} />
        <ProfileAccountRow label="Телефон" value={profile.phone ?? 'Не указан'} />
      </dl>
      <h3>Личные данные</h3>
      <dl>
        <ProfileAccountRow label="Логин" value={profile.login} />
        <ProfileAccountRow label="Имя" value={profile.first_name} />
        <ProfileAccountRow label="Фамилия" value={profile.last_name} />
        <ProfileAccountRow
          label="Дата рождения"
          value={birthdayLabel(profile.birthday)}
        />
        <ProfileAccountRow label="Пол" value={sexLabel(profile.sex)} />
      </dl>
    </div>
  </Dialog>
);
