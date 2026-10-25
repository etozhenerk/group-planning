import { birthdayLabel, sexLabel } from '@/pages/profile/lib/personalLabels';
import styles from '@/pages/profile/ui/ProfilePersonal/ProfilePersonal.module.css';

export type ProfilePersonalProps = {
  login: string | null;
  first_name: string | null;
  last_name: string | null;
  birthday: string | null;
  sex: string | null;
};

export const ProfilePersonal = (profile: ProfilePersonalProps) => (
  <>
    <h2 className={styles.label}>Личные данные</h2>
    <section className={styles.panel} aria-label="Личные данные">
      <dl>
        {[
          ['Логин', profile.login ?? 'Не указано'],
          ['Имя', profile.first_name ?? 'Не указано'],
          ['Фамилия', profile.last_name ?? 'Не указано'],
          ['Дата рождения', birthdayLabel(profile.birthday)],
          ['Пол', sexLabel(profile.sex)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  </>
);
