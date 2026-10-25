import { Mail, UserRound, LockKeyhole } from 'lucide-react';
import { ProfilePersonal } from '@/pages/profile/ui/ProfilePersonal';
import type { ProfilePersonalProps } from '@/pages/profile/ui/ProfilePersonal';
import { Avatar } from '@/shared/ui/Avatar';
import styles from '@/pages/profile/ui/ProfileDetails/ProfileDetails.module.css';

export type ProfileDetailsProps = {
  personal: ProfilePersonalProps;
  name: string;
  avatar: string | null;
  email: string | null;
  phone: string | null;
};

export const ProfileDetails = ({
  name,
  avatar,
  email,
  phone,
  personal,
}: ProfileDetailsProps) => (
  <>
    <section className={styles.identity}>
      <div className={styles.person}>
        <Avatar name={name} src={avatar} size="large" />
        <div>
          <h2>{name}</h2>
          <p>Имя и фото видны участникам встреч</p>
        </div>
      </div>
      <div className={styles.provider}>
        <div>
          <h3>Яндекс ID</h3>
          <p>Аккаунт для входа в somewhere</p>
        </div>
        <span>Подключён</span>
      </div>
    </section>
    <ProfilePersonal {...personal} />
    <h2 className={styles.label}>Контактные данные</h2>
    <section className={styles.contacts}>
      <dl>
        <div>
          <Mail size={20} aria-hidden="true" />
          <div>
            <dt>Почта</dt>
            <dd>{email ?? 'Не указана'}</dd>
          </div>
        </div>
        <div>
          <UserRound size={20} aria-hidden="true" />
          <div>
            <dt>Телефон</dt>
            <dd>{phone ?? 'Не указан'}</dd>
          </div>
        </div>
      </dl>
      <p>
        <LockKeyhole size={14} aria-hidden="true" />
        Видны только вам. Получены из Яндекс ID.
      </p>
    </section>
  </>
);
