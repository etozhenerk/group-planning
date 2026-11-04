import { Dialog } from "@/shared/ui/Dialog";
import { LockKeyhole } from "lucide-react";
import { birthdayLabel, sexLabel } from "@/pages/profile/lib/personalLabels";
import { ProfileDataRow } from "@p/ui/ProfileDataRow";
import type { ProfileModel } from "@p/model/useProfilePreview";
import styles from "@p/ui/ProfileData/ProfileData.module.css";
export type ProfileDataProps = { model: ProfileModel };
export const ProfileData = ({ model: m }: ProfileDataProps) => (
  <Dialog
    open={m.open}
    title="Данные аккаунта"
    onClose={() => m.setOpen(false)}
    returnFocus={m.trigger}
    chatAction
  >
    <div className={styles.data}>
      <p className={styles.privacy}>
        <LockKeyhole size={16} strokeWidth={1.6} />
        Эти данные видны только вам
      </p>
      <p className={styles.source}>Получены из Яндекс ID</p>
      <h3>Контакты</h3>
      <dl>
        <ProfileDataRow label="Почта" value={m.profile.email ?? "Не указана"} />
        <ProfileDataRow
          label="Телефон"
          value={m.profile.phone ?? "Не указан"}
        />
      </dl>
      <h3>Личные данные</h3>
      <dl>
        <ProfileDataRow label="Логин" value={m.profile.login} />
        <ProfileDataRow label="Имя" value={m.profile.first_name} />
        <ProfileDataRow label="Фамилия" value={m.profile.last_name} />
        <ProfileDataRow
          label="Дата рождения"
          value={birthdayLabel(m.profile.birthday)}
        />
        <ProfileDataRow label="Пол" value={sexLabel(m.profile.sex)} />
      </dl>
    </div>
  </Dialog>
);
